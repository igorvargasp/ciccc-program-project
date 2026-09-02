import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Calendar, Flag } from 'lucide-react';
import { getPlayer } from '../api/players';
import { getTeam } from '../api/teams';
import { PageSpinner } from '../components/ui/Spinner';
import Avatar from '../components/ui/Avatar';
import { formatDate, cn } from '../lib/utils';

const positionColors: Record<string, string> = {
  GK: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  DEF: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  MID: 'bg-green-500/10 text-green-400 border-green-500/20',
  FWD: 'bg-red-500/10 text-red-400 border-red-500/20',
};

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-surface-2 rounded-xl p-4 text-center">
      <p className="text-2xl font-black text-foreground">{value}</p>
      <p className="text-xs text-muted mt-1 font-semibold">{label}</p>
    </div>
  );
}

export default function PlayerDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  const { data: player, isLoading } = useQuery({
    queryKey: ['player', id],
    queryFn: () => getPlayer(id!),
    enabled: !!id,
  });

  const { data: team } = useQuery({
    queryKey: ['team', player?.teamId],
    queryFn: () => getTeam(player!.teamId!),
    enabled: !!player?.teamId,
  });

  if (isLoading) return <PageSpinner />;
  if (!player) return <p className="text-muted">{t('errors.notFound')}</p>;

  const agg = player.statistics.reduce(
    (acc, s) => ({
      appearances: acc.appearances + s.appearances,
      goals: acc.goals + s.goals,
      assists: acc.assists + s.assists,
      minutes: acc.minutes + s.minutesPlayed,
    }),
    { appearances: 0, goals: 0, assists: 0, minutes: 0 },
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <Link to="/players" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> {t('common.back')}
      </Link>

      {/* Profile card */}
      <div className="bg-surface border border-edge/12 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        <Avatar name={player.fullName} src={player.photoUrl} size="xl" />

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-foreground leading-tight">{player.fullName}</h1>
            {player.shirtNumber && (
              <span className="text-2xl font-black text-muted">#{player.shirtNumber}</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            {player.position && (
              <span
                className={cn(
                  'text-xs font-bold px-2 py-0.5 rounded-full border',
                  positionColors[player.position] ?? 'bg-surface-2 text-muted',
                )}
              >
                {t(`positions.${player.position}`)}
              </span>
            )}
            {team && (
              <Link
                to={`/teams/${team.id}`}
                className="flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
              >
                {team.crestUrl && (
                  <img src={team.crestUrl} alt={team.name} className="w-4 h-4 object-contain" />
                )}
                {team.name}
              </Link>
            )}
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm text-muted">
            {player.nationality && (
              <span className="flex items-center gap-1">
                <Flag className="w-3.5 h-3.5" /> {player.nationality}
              </span>
            )}
            {player.dateOfBirth && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(player.dateOfBirth, { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Aggregated stats */}
      {player.statistics.length > 0 && (
        <div>
          <h2 className="text-base font-extrabold text-foreground mb-3">{t('players.stats')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label={t('players.appearances')} value={agg.appearances} />
            <StatBox label={t('players.goals')} value={agg.goals} />
            <StatBox label={t('players.assists')} value={agg.assists} />
            <StatBox label={t('players.minutes')} value={agg.minutes.toLocaleString()} />
          </div>
        </div>
      )}

      {/* Per-season breakdown */}
      {player.statistics.length > 1 && (
        <div className="bg-surface border border-edge/12 rounded-2xl p-5">
          <h2 className="text-base font-bold text-foreground mb-4">{t('players.stats')}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted border-b border-edge/12">
                <th className="text-left pb-2">{t('players.appearances')}</th>
                <th className="text-center pb-2">{t('players.goals')}</th>
                <th className="text-center pb-2">{t('players.assists')}</th>
                <th className="text-center pb-2">{t('players.minutes')}</th>
                {player.statistics.some((s) => s.rating) && (
                  <th className="text-center pb-2">{t('players.rating')}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {player.statistics.map((s) => (
                <tr key={s.id} className="border-b border-edge/6">
                  <td className="py-2 text-foreground">{s.appearances}</td>
                  <td className="py-2 text-center text-foreground font-semibold">{s.goals}</td>
                  <td className="py-2 text-center text-muted">{s.assists}</td>
                  <td className="py-2 text-center text-muted">{s.minutesPlayed}</td>
                  {player.statistics.some((st) => st.rating) && (
                    <td className="py-2 text-center">
                      {s.rating ? (
                        <span className="font-bold text-brand">{parseFloat(s.rating).toFixed(1)}</span>
                      ) : '—'}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
