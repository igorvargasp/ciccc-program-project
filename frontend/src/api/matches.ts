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
