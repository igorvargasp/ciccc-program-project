import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Bell, Trophy, Clock, Newspaper, Calendar, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listMatches } from '../api/matches';
import { listNews } from '../api/news';
import { useTeamsMap } from '../hooks/useTeamsMap';
import { useAuth } from '../context/AuthContext';
import { relativeTime, formatMatchDay, formatKickoff } from '../lib/utils';
import Skeleton from '../components/ui/Skeleton';

function SectionHeader({ icon: Icon, title, color = 'text-[#00d2fd]' }: { icon: any; title: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className={`w-4 h-4 ${color}`} />
      <h2 className={`text-xs font-black uppercase tracking-[0.15em] ${color}`}>{title}</h2>
    </div>
  );
}

export default function Notifications() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const teamsMap = useTeamsMap();

  const [favoriteTeam] = useState(() => {
    const saved = localStorage.getItem('favorite_team');
    if (!saved) return null;
    try { return JSON.parse(saved); } catch { return null; }
  });

  const teamId = favoriteTeam?.id ? String(favoriteTeam.id) : (user?.favoriteTeamId ? String(user.favoriteTeamId) : undefined);
  const teamName = favoriteTeam?.name || (teamId ? teamsMap.get(teamId as any)?.name : undefined);

  const now = new Date().toISOString();

  const { data: results, isLoading: loadingResults } = useQuery({
    queryKey: ['matches', { teamId, status: 'finished', limit: 5 }],
    queryFn: () => listMatches({ teamId, status: 'finished', limit: 5 }),
    enabled: !!teamId,
  });

  const { data: upcoming, isLoading: loadingUpcoming } = useQuery({
    queryKey: ['matches', { teamId, status: 'scheduled', limit: 5, from: now }],
    queryFn: () => listMatches({ teamId, status: 'scheduled', limit: 5, from: now }),
    enabled: !!teamId,
  });

  const { data: news, isLoading: loadingNews } = useQuery({
    queryKey: ['news', { teamId, limit: 6 }],
    queryFn: () => listNews({ teamId, limit: 6 }),
  });

  const isLoading = loadingResults || loadingUpcoming || loadingNews;

  const getTeamName = (id: string) => teamsMap.get(id as any)?.name ?? teamsMap.get(id as any)?.shortName ?? '—';

  if (!teamId) {
    return (
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-2xl font-black text-foreground">{t('notifications.title', 'Notifications')}</h1>
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-surface border border-edge/12 rounded-2xl">
          <Star className="w-12 h-12 text-muted opacity-30" />
          <div>
            <p className="font-semibold text-foreground">No favourite team selected</p>
            <p className="text-sm text-muted mt-1">Go to your profile to pick a team and see match reminders &amp; news here.</p>
          </div>
          <Link to="/profile" className="px-4 py-2 text-xs font-bold bg-[#00d2fd]/10 text-[#00d2fd] border border-[#00d2fd]/40 rounded-lg hover:bg-[#00d2fd]/20 transition-colors">
            Go to Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black text-foreground">{t('notifications.title', 'Notifications')}</h1>
        {teamName && (
          <p className="text-xs text-[#00d2fd] font-bold uppercase tracking-wider mt-1">
            Showing updates for {teamName}
          </p>
        )}
      </div>

      {/* Upcoming Matches */}
      <section>
        <SectionHeader icon={Clock} title="Upcoming Matches" color="text-[#00d2fd]" />
        <div className="bg-surface border border-edge/12 rounded-2xl overflow-hidden">
          {loadingUpcoming ? (
            <div className="p-4 space-y-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : !upcoming?.length ? (
            <div className="px-5 py-8 text-center text-sm text-muted">No upcoming fixtures scheduled.</div>
          ) : (
            upcoming.map((m, i) => {
              const home = getTeamName(m.homeTeamId);
              const away = getTeamName(m.awayTeamId);
              const isMyTeam = (id: string) => id === teamId;
              return (
                <Link
                  key={m.id}
                  to={`/matches/${m.id}`}
                  className={`flex items-center gap-4 px-5 py-3.5 hover:bg-surface-2 transition-colors ${i < upcoming.length - 1 ? 'border-b border-edge/12' : ''}`}
                >
                  <Calendar className="w-4 h-4 text-[#00d2fd] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      <span className={isMyTeam(m.homeTeamId) ? 'text-[#00d2fd]' : ''}>{home}</span>
                      {' vs '}
                      <span className={isMyTeam(m.awayTeamId) ? 'text-[#00d2fd]' : ''}>{away}</span>
                    </p>
                    <p className="text-xs text-muted">{formatMatchDay(m.kickoffAt)} · {formatKickoff(m.kickoffAt)}{m.matchday ? ` · Matchday ${m.matchday}` : ''}</p>
                  </div>
                  <span className="text-xs text-[#00d2fd] font-semibold flex-shrink-0">{relativeTime(m.kickoffAt)}</span>
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* Recent Results */}
      <section>
        <SectionHeader icon={Trophy} title="Recent Results" color="text-amber-400" />
        <div className="bg-surface border border-edge/12 rounded-2xl overflow-hidden">
          {loadingResults ? (
            <div className="p-4 space-y-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : !results?.length ? (
            <div className="px-5 py-8 text-center text-sm text-muted">No recent results found.</div>
          ) : (
            results.map((m, i) => {
              const home = getTeamName(m.homeTeamId);
              const away = getTeamName(m.awayTeamId);
              const isMyTeam = (id: string) => id === teamId;
              const myTeamWon =
                (isMyTeam(m.homeTeamId) && (m.homeScore ?? 0) > (m.awayScore ?? 0)) ||
                (isMyTeam(m.awayTeamId) && (m.awayScore ?? 0) > (m.homeScore ?? 0));
              const draw = m.homeScore === m.awayScore;
              const resultColor = draw ? 'text-muted' : myTeamWon ? 'text-green-400' : 'text-red-400';
              return (
                <Link
                  key={m.id}
                  to={`/matches/${m.id}`}
                  className={`flex items-center gap-4 px-5 py-3.5 hover:bg-surface-2 transition-colors ${i < results.length - 1 ? 'border-b border-edge/12' : ''}`}
                >
                  <Trophy className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      <span className={isMyTeam(m.homeTeamId) ? 'text-[#00d2fd]' : ''}>{home}</span>
                      {' '}
                      <span className={`font-black ${resultColor}`}>{m.homeScore ?? '?'} – {m.awayScore ?? '?'}</span>
                      {' '}
                      <span className={isMyTeam(m.awayTeamId) ? 'text-[#00d2fd]' : ''}>{away}</span>
                    </p>
                    <p className="text-xs text-muted">{formatMatchDay(m.kickoffAt)}{m.matchday ? ` · Matchday ${m.matchday}` : ''}</p>
                  </div>
                  <span className={`text-xs font-bold flex-shrink-0 ${resultColor}`}>
                    {draw ? 'Draw' : myTeamWon ? 'Win' : 'Loss'}
                  </span>
                </Link>
              );
            })
          )}
        </div>
      </section>

      {/* Latest News */}
      <section>
        <SectionHeader icon={Newspaper} title="Latest News" color="text-purple-400" />
        <div className="bg-surface border border-edge/12 rounded-2xl overflow-hidden">
          {loadingNews ? (
            <div className="p-4 space-y-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : !news?.length ? (
            <div className="px-5 py-8 text-center text-sm text-muted">No recent news available.</div>
          ) : (
            news.map((article, i) => (
              <a
                key={article.id}
                href={article.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-start gap-4 px-5 py-3.5 hover:bg-surface-2 transition-colors ${i < news.length - 1 ? 'border-b border-edge/12' : ''}`}
              >
                <Newspaper className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground line-clamp-2">{article.title}</p>
                  {article.source && <p className="text-xs text-muted mt-0.5">{article.source}</p>}
                </div>
                <span className="text-xs text-muted flex-shrink-0">{relativeTime(article.publishedAt ?? article.fetchedAt)}</span>
              </a>
            ))
          )}
        </div>
      </section>

      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <Bell className="w-3.5 h-3.5 animate-pulse" />
          Loading your updates…
        </div>
      )}
    </div>
  );
}
