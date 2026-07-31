import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { listCompetitions } from '../api/competitions';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';

export default function Competitions() {
  const { t } = useTranslation();

  const { data: competitions, isLoading } = useQuery({
    queryKey: ['competitions'],
    queryFn: listCompetitions,
    staleTime: 5 * 60_000,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-foreground">{t('competitions.title')}</h1>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !competitions?.length ? (
        <EmptyState
          icon={<Trophy className="w-12 h-12" />}
          title={t('competitions.noCompetitions')}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {competitions.map((comp) => (
            <Link key={comp.id} to={`/competitions/${comp.id}`}>
              <div className="group bg-surface border border-edge/12 rounded-xl p-5 flex items-center gap-4 hover:border-brand/30 transition-all duration-150">
                {comp.logoUrl ? (
                  <img
                    src={comp.logoUrl}
                    alt={comp.name}
                    className="w-12 h-12 object-contain flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-5 h-5 text-muted" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-bold text-foreground group-hover:text-brand transition-colors truncate">
                    {comp.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {comp.country && (
                      <span className="text-xs text-muted">{comp.country}</span>
                    )}
                    <span className="text-xs text-muted capitalize">{comp.type}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
