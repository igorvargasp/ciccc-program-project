import { apiClient } from './client';
import type { Match, MatchDetail } from '../types';

export interface ListMatchesParams {
  teamId?: string;
  seasonId?: string;
  competitionId?: string;
  status?: 'scheduled' | 'live' | 'finished';
  matchday?: number;
  from?: string;
  to?: string;
  limit?: number;
}

export async function listMatches(params?: ListMatchesParams): Promise<Match[]> {
  const { data } = await apiClient.get<{ data: Match[] }>('/matches', { params });
  return data.data;
}

export async function getMatch(id: string): Promise<MatchDetail> {
  const { data } = await apiClient.get<{ data: MatchDetail }>(`/matches/${id}`);
  return data.data;
}

export interface MatchFormEntry {
  matchId: string;
  kickoffAt: string | null;
  result: 'W' | 'D' | 'L' | null;
  scored: number | null;
  conceded: number | null;
}

export interface MatchContext {
  form: { home: MatchFormEntry[]; away: MatchFormEntry[] };
  headToHead: {
    homeWins: number;
    awayWins: number;
    draws: number;
    matches: unknown[];
  };
  standings: {
    home: { position: number | null; points: number; played: number } | null;
    away: { position: number | null; points: number; played: number } | null;
  };
}

/**
 * Recent form, head-to-head record and league position for a fixture. Derived
 * from matches we already hold, so it works for upcoming games too — where
 * there is no report to show yet.
 */
export async function getMatchContext(id: string): Promise<MatchContext> {
  const { data } = await apiClient.get<{ data: MatchContext }>(
    `/matches/${id}/context`,
  );
  return data.data;
}
