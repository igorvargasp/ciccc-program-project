import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Radio } from 'lucide-react';
import { listMatches } from '../api/matches';
import { listNews } from '../api/news';
import { listCompetitions } from '../api/competitions';
import MatchCard from '../components/MatchCard';
import NewsCard from '../components/NewsCard';
import { useTeamsMap } from '../hooks/useTeamsMap';
import { useNewsRealtime } from '../hooks/useRealtime';
import { SkeletonCard } from '../components/ui/Skeleton';
import { cn } from '../lib/utils';

const UPCOMING_PAGE_SIZE = 6;

export default function Home() {
  const { t } = useTranslation();
  const teamsMap = useTeamsMap();
  const [competitionId, setCompetitionId] = useState<string | undefined>(undefined);
  const [showAll, setShowAll] = useState(false);

  // Subscribe to live news via Socket.IO
  useNewsRealtime();

  const { data: competitions } = useQuery({
    queryKey: ['competitions'],
    queryFn: listCompetitions,
    staleTime: 10 * 60_000,
  });

  const { data: liveMatches, isLoading: loadingLive } = useQuery({
    queryKey: ['matches', { status: 'live' }],
    queryFn: () => listMatches({ status: 'live', limit: 6 }),
    refetchInterval: 30_000,
  });

  const { data: upcomingMatches, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['matches', { status: 'scheduled', competitionId }],
    queryFn: () => listMatches({ status: 'scheduled', competitionId, limit: 50 }),
    staleTime: 60_000,
  });

  const { data: news, isLoading: loadingNews } = useQuery({
    queryKey: ['news'],
    queryFn: () => listNews({ limit: 9 }),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-10">
      {/* ── Hero ── */}
      <section className="relative rounded-2xl overflow-hidden bg-surface border border-edge/12 p-6 md:p-10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-brand/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-brand/10 blur-2xl" />
        </div>
        <div className="relative">
          <h1 className="text-3xl md:text-5xl font-black text-foreground mb-3 leading-tight">
            AliScore
          </h1>
          <p className="text-muted text-base md:text-lg max-w-lg">{t('home.subtitle')}</p>
        </div>
      </section>

      {/* ── Live matches ── */}
      {(loadingLive || (liveMatches && liveMatches.length > 0)) && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-green-400 animate-live-dot" />
              <h2 className="text-lg font-extrabold text-foreground">{t('home.liveMatches')}</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {loadingLive
              ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
              : liveMatches?.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    homeTeam={teamsMap.get(m.homeTeamId)}
                    awayTeam={teamsMap.get(m.awayTeamId)}
                  />
                ))}
          </div>
        </section>
      )}

      {/* ── Upcoming matches ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-foreground">{t('home.upcomingMatches')}</h2>
          <Link to="/matches" className="flex items-center gap-1 text-sm text-brand font-semibold hover:underline">
            {t('common.seeAll')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* League filter */}
        {competitions && competitions.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            <button
              onClick={() => { setCompetitionId(undefined); setShowAll(false); }}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                !competitionId
                  ? 'bg-brand text-white border-brand'
                  : 'bg-surface-2 text-muted border-edge/12 hover:text-foreground',
              )}
            >
              {t('common.all')}
            </button>
            {competitions.map((c) => (
              <button
                key={c.id}
                onClick={() => { setCompetitionId(c.id === competitionId ? undefined : c.id); setShowAll(false); }}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                  competitionId === c.id
                    ? 'bg-brand text-white border-brand'
                    : 'bg-surface-2 text-muted border-edge/12 hover:text-foreground',
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loadingUpcoming
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : upcomingMatches?.length
              ? (showAll ? upcomingMatches : upcomingMatches.slice(0, UPCOMING_PAGE_SIZE)).map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    homeTeam={teamsMap.get(m.homeTeamId)}
                    awayTeam={teamsMap.get(m.awayTeamId)}
                  />
                ))
              : <p className="text-muted text-sm col-span-full">{t('common.noData')}</p>}
        </div>

        {/* Show more / show less */}
        {!loadingUpcoming && upcomingMatches && upcomingMatches.length > UPCOMING_PAGE_SIZE && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setShowAll((v) => !v)}
              className="px-5 py-2 rounded-lg bg-surface-2 border border-edge/12 text-sm font-semibold text-muted hover:text-foreground transition-colors"
            >
              {showAll ? t('common.showLess') : t('common.showMore', { n: upcomingMatches.length - UPCOMING_PAGE_SIZE })}
            </button>
          </div>
        )}
      </section>

      {/* ── Latest news ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-foreground">{t('home.latestNews')}</h2>
          <Link to="/news" className="flex items-center gap-1 text-sm text-brand font-semibold hover:underline">
            {t('common.seeAll')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingNews
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : news?.length
              ? news.slice(0, 6).map((a) => <NewsCard key={a.id} article={a} />)
              : <p className="text-muted text-sm col-span-full">{t('news.noNews')}</p>}
        </div>
      </section>
    </div>
  );
}
