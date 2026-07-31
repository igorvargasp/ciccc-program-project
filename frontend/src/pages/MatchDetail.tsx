import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MapPin } from 'lucide-react';
import { getMatch } from '../api/matches';
import { getTeam } from '../api/teams';
import { PageSpinner } from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';
import { useMatchRealtime } from '../hooks/useRealtime';
import { formatMatchDay, formatKickoff, cn } from '../lib/utils';

const EVENT_ICONS: Record<string, string> = {
  goal: '⚽',
  assist: '🎯',
  yellow: '🟨',
  red: '🟥',
  sub: '🔄',
};

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  // Real-time score updates
  useMatchRealtime(id);

  const { data: match, isLoading } = useQuery({
    queryKey: ['match', id],
    queryFn: () => getMatch(id!),
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.status === 'live' ? 30_000 : false,
  });

  const { data: homeTeam } = useQuery({
    queryKey: ['team', match?.homeTeamId],
    queryFn: () => getTeam(match!.homeTeamId),
    enabled: !!match?.homeTeamId,
  });

  const { data: awayTeam } = useQuery({
    queryKey: ['team', match?.awayTeamId],
    queryFn: () => getTeam(match!.awayTeamId),
    enabled: !!match?.awayTeamId,
  });

  if (isLoading) return <PageSpinner />;
  if (!match) return <p className="text-muted">{t('errors.notFound')}</p>;

  const statusBadge =
    match.status === 'live' ? (
      <Badge variant="live" dot>{t('matches.live')}</Badge>
    ) : match.status === 'finished' ? (
      <Badge variant="finished">{t('matches.fulltime')}</Badge>
    ) : (
      <Badge variant="scheduled">{t('matches.upcoming')}</Badge>
    );

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link to="/matches" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> {t('common.back')}
      </Link>

      {/* Scoreboard */}
      <div className="bg-surface border border-edge/12 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          {statusBadge}
          <div className="text-right">
            {match.matchday && (
              <p className="text-xs text-muted">{t('matches.matchday', { n: match.matchday })}</p>
            )}
            <p className="text-xs text-muted">
              {formatMatchDay(match.kickoffAt)} · {formatKickoff(match.kickoffAt)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Home team */}
          <div className="flex flex-col items-center gap-2 flex-1">
            {homeTeam?.crestUrl ? (
              <img src={homeTeam.crestUrl} alt={homeTeam.name} className="w-16 h-16 object-contain" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-surface-2 flex items-center justify-center">
                <span className="text-sm font-black text-muted">{homeTeam?.shortName ?? '?'}</span>
              </div>
            )}
            <Link to={`/teams/${match.homeTeamId}`} className="text-sm font-bold text-foreground hover:text-brand transition-colors text-center">
              {homeTeam?.name ?? '—'}
            </Link>
          </div>

          {/* Score */}
          <div className="text-center flex-shrink-0">
            {match.status !== 'scheduled' ? (
              <span className="text-5xl font-black text-foreground">
                {match.homeScore ?? '?'} – {match.awayScore ?? '?'}
              </span>
            ) : (
              <span className="text-xl font-bold text-muted">{t('common.vs')}</span>
            )}
          </div>

          {/* Away team */}
          <div className="flex flex-col items-center gap-2 flex-1">
            {awayTeam?.crestUrl ? (
              <img src={awayTeam.crestUrl} alt={awayTeam.name} className="w-16 h-16 object-contain" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-surface-2 flex items-center justify-center">
                <span className="text-sm font-black text-muted">{awayTeam?.shortName ?? '?'}</span>
              </div>
            )}
            <Link to={`/teams/${match.awayTeamId}`} className="text-sm font-bold text-foreground hover:text-brand transition-colors text-center">
              {awayTeam?.name ?? '—'}
            </Link>
          </div>
        </div>

        {match.venue && (
          <div className="flex items-center justify-center gap-1.5 mt-5 text-sm text-muted">
            <MapPin className="w-3.5 h-3.5" /> {match.venue}
          </div>
        )}
      </div>

      {/* Events timeline */}
      {match.events && match.events.length > 0 && (
        <div className="bg-surface border border-edge/12 rounded-2xl p-5">
          <h2 className="text-base font-bold text-foreground mb-4">{t('matches.events')}</h2>
          <ol className="space-y-2">
            {match.events.map((ev) => (
              <li key={ev.id} className="flex items-start gap-3">
                <span className="text-xs font-bold text-muted w-10 flex-shrink-0 pt-0.5">
                  {ev.minute != null ? `${ev.minute}'` : '—'}
                </span>
                <span className="text-base">{EVENT_ICONS[ev.type] ?? '•'}</span>
                <div>
                  <p className={cn('text-sm font-semibold capitalize', ev.type === 'red' && 'text-red-400', ev.type === 'yellow' && 'text-yellow-400')}>
                    {ev.type}
                  </p>
                  {ev.detail && <p className="text-xs text-muted">{ev.detail}</p>}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
