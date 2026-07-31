import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Radio, Wifi } from 'lucide-react';
import { listNews } from '../api/news';
import { listTeams } from '../api/teams';
import NewsCard from '../components/NewsCard';
import { SkeletonCard } from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useNewsRealtime } from '../hooks/useRealtime';

export default function News() {
  const { t } = useTranslation();
  const [teamId, setTeamId] = useState<string | undefined>(undefined);
  const [isLive, setIsLive] = useState(false);
  const prevCountRef = useRef(0);

  // Real-time incoming articles
  useNewsRealtime();

  const { data: news, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['news', { teamId }],
    queryFn: () => listNews({ teamId, limit: 30 }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: teams } = useQuery({
    queryKey: ['teams', { limit: 200 }],
    queryFn: () => listTeams({ limit: 200 }),
    staleTime: 5 * 60_000,
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

      {/* Team filter */}
      {teams && teams.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setTeamId(undefined)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              !teamId
                ? 'bg-brand text-white border-brand'
                : 'bg-surface-2 text-muted border-edge/12 hover:text-foreground'
            }`}
          >
            {t('news.allTeams')}
          </button>
          {teams.slice(0, 12).map((team) => (
            <button
              key={team.id}
              onClick={() => setTeamId(team.id === teamId ? undefined : team.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                teamId === team.id
                  ? 'bg-brand text-white border-brand'
                  : 'bg-surface-2 text-muted border-edge/12 hover:text-foreground'
              }`}
            >
              {team.shortName ?? team.name}
            </button>
          ))}
        </div>
      )}

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
