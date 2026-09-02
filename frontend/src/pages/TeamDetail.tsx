import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, MapPin, Calendar, Building2 } from 'lucide-react';
import { getTeam, getTeamSquad, getTeamStandings } from '../api/teams';
import { listMatches } from '../api/matches';
import PlayerCard from '../components/PlayerCard';
import MatchCard from '../components/MatchCard';
import StandingsTable from '../components/StandingsTable';
import { PageSpinner } from '../components/ui/Spinner';
import { useTeamsMap } from '../hooks/useTeamsMap';
import { cn } from '../lib/utils';

type Tab = 'squad' | 'matches' | 'standings';

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('squad');
  const teamsMap = useTeamsMap();

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => getTeam(id!),
    enabled: !!id,
  });

  const { data: squad } = useQuery({
    queryKey: ['squad', id],
    queryFn: () => getTeamSquad(id!),
    enabled: !!id && tab === 'squad',
  });

  const { data: matches } = useQuery({
    queryKey: ['matches', { teamId: id }],
    queryFn: () => listMatches({ teamId: id!, limit: 10 }),
    enabled: !!id && tab === 'matches',
  });

  const { data: standings } = useQuery({
    queryKey: ['team-standings', id],
    queryFn: () => getTeamStandings(id!),
    enabled: !!id && tab === 'standings',
  });

  if (isLoading) return <PageSpinner />;
  if (!team) return <p className="text-muted">{t('errors.notFound')}</p>;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'squad', label: t('teams.squad') },
    { key: 'matches', label: t('matches.title') },
    { key: 'standings', label: t('teams.standings') },
  ];

  const byPosition = (squad ?? []).reduce(
    (acc, p) => {
      const pos = p.position ?? 'Unknown';
      if (!acc[pos]) acc[pos] = [];
      acc[pos].push(p);
      return acc;
    },
    {} as Record<string, typeof squad>,
  );

  const posOrder = ['GK', 'DEF', 'MID', 'FWD', 'Unknown'];

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link to="/teams" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" />
        {t('common.back')}
      </Link>

      {/* Team header */}
      <div className="bg-surface border border-edge/12 rounded-2xl p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
        {team.crestUrl ? (
          <img src={team.crestUrl} alt={team.name} className="w-20 h-20 object-contain" />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-surface-2 flex items-center justify-center text-2xl font-black text-muted">
            {team.shortName?.slice(0, 3) ?? team.name.slice(0, 3).toUpperCase()}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-black text-foreground">{team.name}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted">
            {team.country && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {team.country}
              </span>
            )}
            {team.stadium && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" /> {team.stadium}
              </span>
            )}
            {team.foundedYear && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> {t('teams.founded')} {team.foundedYear}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-2 rounded-xl p-1 w-fit">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-150',
              tab === key
                ? 'bg-brand text-white shadow-sm'
                : 'text-muted hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'squad' && (
        <div className="space-y-6">
          {posOrder.map((pos) => {
            const players = byPosition[pos];
            if (!players?.length) return null;
            return (
              <div key={pos}>
                <h3 className="text-xs font-bold text-muted uppercase tracking-widest mb-3">
                  {t(`positions.${pos}`, { defaultValue: pos })}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {players.map((p) => <PlayerCard key={p.id} player={p} compact />)}
                </div>
              </div>
            );
          })}
          {!squad?.length && (
            <p className="text-muted text-sm">{t('common.noData')}</p>
          )}
        </div>
      )}

      {tab === 'matches' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {matches?.length
            ? matches.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  homeTeam={teamsMap.get(m.homeTeamId)}
                  awayTeam={teamsMap.get(m.awayTeamId)}
                />
              ))
            : <p className="text-muted text-sm">{t('matches.noMatches')}</p>}
        </div>
      )}

      {tab === 'standings' && (
        <div className="space-y-6">
          {standings?.length
            ? standings.map((s) => (
                <div key={s.seasonId} className="bg-surface border border-edge/12 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    {s.competition.logoUrl && (
                      <img src={s.competition.logoUrl} alt={s.competition.name} className="w-6 h-6 object-contain" />
                    )}
                    <div>
                      <p className="font-bold text-foreground">{s.competition.name}</p>
                      <p className="text-xs text-muted">{s.label}</p>
                    </div>
                  </div>
                  <StandingsTable rows={s.table} highlightTeamId={id} />
                </div>
              ))
            : <p className="text-muted text-sm">{t('common.noData')}</p>}
        </div>
      )}
    </div>
  );
}
