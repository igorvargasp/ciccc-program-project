import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search, User } from 'lucide-react';
import { listPlayers } from '../api/players';
import PlayerCard from '../components/PlayerCard';
import CompetitionPills from '../components/CompetitionPills';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import type { Position } from '../types';
import { cn } from '../lib/utils';

const POSITIONS: (Position | 'all')[] = ['all', 'GK', 'DEF', 'MID', 'FWD'];

export default function Players() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState<Position | 'all'>('all');
  const [competitionId, setCompetitionId] = useState<string | undefined>(undefined);
  const [inputVal, setInputVal] = useState('');

  const { data: players, isLoading } = useQuery({
    queryKey: ['players', { search, position, competitionId }],
    queryFn: () =>
      listPlayers({
        search: search || undefined,
        position: position === 'all' ? undefined : position,
        competitionId,
        limit: 100,
      }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(inputVal.trim());
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-foreground">{t('players.title')}</h1>

      {/* Search + position filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={t('players.searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-edge/12 rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-brand transition-colors"
          />
        </form>

        <div className="flex gap-1 bg-surface-2 rounded-xl p-1">
          {POSITIONS.map((pos) => (
            <button
              key={pos}
              onClick={() => setPosition(pos)}
              className={cn(
                'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
                position === pos ? 'bg-brand text-white' : 'text-muted hover:text-foreground',
              )}
            >
              {pos === 'all' ? t('players.allPositions').split(' ')[0] : pos}
            </button>
          ))}
        </div>
      </div>

      {/* League filter */}
      <CompetitionPills value={competitionId} onChange={setCompetitionId} />

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !players?.length ? (
        <EmptyState
          icon={<User className="w-12 h-12" />}
          title={t('players.noPlayers')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {players.map((p) => <PlayerCard key={p.id} player={p} />)}
        </div>
      )}
    </div>
  );
}
