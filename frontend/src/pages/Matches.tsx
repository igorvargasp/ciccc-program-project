import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { listMatches } from '../api/matches';
import MatchCard from '../components/MatchCard';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { Calendar } from 'lucide-react';
import { useTeamsMap } from '../hooks/useTeamsMap';
import { cn } from '../lib/utils';

type StatusFilter = 'live' | 'scheduled' | 'finished';

const TABS: { key: StatusFilter | 'all'; label: string }[] = [
  { key: 'live', label: 'matches.live' },
  { key: 'scheduled', label: 'matches.upcoming' },
  { key: 'finished', label: 'matches.finished' },
];

export default function Matches() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<StatusFilter>('scheduled');
  const teamsMap = useTeamsMap();

  const { data: matches, isLoading } = useQuery({
    queryKey: ['matches', { status }],
    queryFn: () => listMatches({ status, limit: 50 }),
    refetchInterval: status === 'live' ? 30_000 : undefined,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-foreground">{t('matches.title')}</h1>

      {/* Status tabs */}
      <div className="flex gap-1 bg-surface-2 rounded-xl p-1 w-fit">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatus(key as StatusFilter)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-all',
              status === key ? 'bg-brand text-white' : 'text-muted hover:text-foreground',
            )}
          >
            {key === 'live' && status === 'live' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-live-dot" />
            )}
            {t(label)}
          </button>
        ))}
      </div>

      {/* Matches grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !matches?.length ? (
        <EmptyState
          icon={<Calendar className="w-12 h-12" />}
          title={t('matches.noMatches')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {matches.map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              homeTeam={teamsMap.get(m.homeTeamId)}
              awayTeam={teamsMap.get(m.awayTeamId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
