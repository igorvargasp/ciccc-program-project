import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket, RT } from '../lib/socket';
import type { Match, NewsArticle } from '../types';

/** Subscribe to live score updates for a specific match. */
export function useMatchRealtime(matchId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!matchId) return;
    const socket = connectSocket();

    socket.emit(RT.SUBSCRIBE, { matches: [matchId] });

    const onUpdate = (updated: Match) => {
      if (updated.id !== matchId) return;
      qc.setQueryData<Match & { events: unknown[] }>(['match', matchId], (old) =>
        old ? { ...old, ...updated } : undefined,
      );
      // Also refresh the matches list cache
      qc.invalidateQueries({ queryKey: ['matches'] });
    };

    socket.on(RT.MATCH_UPDATE, onUpdate);

    return () => {
      socket.emit(RT.UNSUBSCRIBE, { matches: [matchId] });
      socket.off(RT.MATCH_UPDATE, onUpdate);
    };
  }, [matchId, qc]);
}

/** Receive new news articles in real-time. */
export function useNewsRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = connectSocket();

    const onNews = (article: NewsArticle) => {
      qc.setQueryData<NewsArticle[]>(['news'], (old) =>
        old ? [article, ...old] : [article],
      );
    };

    socket.on(RT.NEWS_NEW, onNews);
    return () => { socket.off(RT.NEWS_NEW, onNews); };
  }, [qc]);
}

/** Invalidate standings when the server broadcasts an update. */
export function useStandingsRealtime(seasonId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!seasonId) return;
    const socket = connectSocket();

    socket.emit(RT.SUBSCRIBE, { seasons: [seasonId] });

    const onUpdate = () => {
      qc.invalidateQueries({ queryKey: ['standings'] });
    };

    socket.on(RT.STANDINGS_UPDATE, onUpdate);

    return () => {
      socket.emit(RT.UNSUBSCRIBE, { seasons: [seasonId] });
      socket.off(RT.STANDINGS_UPDATE, onUpdate);
    };
  }, [seasonId, qc]);
}

/** Invalidate notifications when a new one arrives via socket. */
export function useNotificationRealtime() {
  const qc = useQueryClient();

  useEffect(() => {
    const socket = connectSocket();

    const onNotification = () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on(RT.NOTIFICATION_NEW, onNotification);
    return () => { socket.off(RT.NOTIFICATION_NEW, onNotification); };
  }, [qc]);
}

/** Subscribe to multiple team rooms (for Home dashboard). */
export function useTeamsRealtime(teamIds: string[]) {
  useEffect(() => {
    if (!teamIds.length) return;
    const socket = connectSocket();
    socket.emit(RT.SUBSCRIBE, { teams: teamIds });
    return () => { socket.emit(RT.UNSUBSCRIBE, { teams: teamIds }); };
  }, [teamIds.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
}
