import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { listTeams } from '../api/teams';
import TeamCard from '../components/TeamCard';
import CompetitionPills from '../components/CompetitionPills';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { Users } from 'lucide-react';

export default function Teams() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [input, setInput] = useState(searchParams.get('search') ?? '');
  const [competitionId, setCompetitionId] = useState<string | undefined>(undefined);

  const search = searchParams.get('search') ?? undefined;

  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams', { search, competitionId, limit: 100 }],
    queryFn: () => listTeams({ search, competitionId, limit: 100 }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    setSearchParams(trimmed ? { search: trimmed } : {});
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">{t('teams.title')}</h1>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('teams.searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-edge/12 rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-brand transition-colors"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-brand text-white text-sm font-semibold rounded-lg hover:bg-brand-hover transition-colors"
        >
          {t('common.seeAll').replace('See ', 'Search').replace('Ver ', 'Buscar ')}
        </button>
      </form>

      {/* League filter */}
      <CompetitionPills value={competitionId} onChange={setCompetitionId} />

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !teams?.length ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title={t('teams.noTeams')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {teams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}
    </div>
  );
}
