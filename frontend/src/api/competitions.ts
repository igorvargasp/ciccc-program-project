import { apiClient } from './client';
import type { Competition, Season, StandingsResponse } from '../types';

export async function listCompetitions(): Promise<Competition[]> {
  const { data } = await apiClient.get<{ data: Competition[] }>('/competitions');
  return data.data;
}

export async function getCompetitionSeasons(id: string): Promise<Season[]> {
  const { data } = await apiClient.get<{ data: Season[] }>(`/competitions/${id}/seasons`);
  return data.data;
}

export async function getCompetitionStandings(
  id: string,
  params?: { seasonId?: string; simulated?: boolean },
): Promise<StandingsResponse> {
  const { data } = await apiClient.get<{ data: StandingsResponse }>(
    `/competitions/${id}/standings`,
    { params },
  );
  return data.data;
}
