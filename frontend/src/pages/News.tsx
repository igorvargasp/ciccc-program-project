import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Radio, Wifi } from 'lucide-react';
import { listNews } from '../api/news';
import NewsCard from '../components/NewsCard';
import CompetitionPills from '../components/CompetitionPills';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useNewsRealtime } from '../hooks/useRealtime';
import { useFavoriteTeam } from '../hooks/useFavoriteTeam';

export default function News() {
  const { t } = useTranslation();
  const { competitionId: favCompetitionId } = useFavoriteTeam();
  const [competitionId, setCompetitionId] = useState<string | undefined>(undefined);
  const [isLive, setIsLive] = useState(false);
  const prevCountRef = useRef(0);

  // Default to the favourite team's competition once resolved
  useEffect(() => {
    if (favCompetitionId && competitionId === undefined) {
      setCompetitionId(favCompetitionId);
    }
  }, [favCompetitionId]); // eslint-disable-line react-hooks/exhaustive-deps

  useNewsRealtime();

  const { data: news, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['news', { competitionId }],
    queryFn: () => listNews({ competitionId, limit: 30 }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // Show "Live" badge when new articles arrive
  useEffect(() => {
    const count = news?.length ?? 0;
    if (prevCountRef.current > 0 && count > prevCountRef.current) {
      setIsLive(true);
      const t = setTimeout(() => setIsLive(false), 5000);
      return () => clearTimeout(t);
    }
    prevCountRef.current = count;
  }, [dataUpdatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-foreground">{t('news.title')}</h1>
        {isLive && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-green-400">
            <Wifi className="w-3.5 h-3.5 animate-live-dot" />
            {t('news.realtimeActive')}
          </div>
        )}
      </div>

      {/* Competition filter */}
      <CompetitionPills value={competitionId} onChange={setCompetitionId} />

      {/* Live indicator */}
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Radio className="w-3.5 h-3.5" />
        {t('news.realtimeActive')} — {t('common.loading').replace('…', '')} auto-refreshes
      </div>

      {/* Articles */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !news?.length ? (
        <EmptyState title={t('news.noNews')} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {news.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}

