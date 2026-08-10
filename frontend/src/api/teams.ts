import { apiClient } from './client';
import type { Team, Player, TeamStandingsItem } from '../types';

export interface ListTeamsParams {
  search?: string;
  country?: string;
  competitionId?: string;
  limit?: number;
}

export async function listTeams(params?: ListTeamsParams): Promise<Team[]> {
  const { data } = await apiClient.get<{ data: Team[] }>('/teams', { params });
  return data.data;
}

export async function getTeam(id: string): Promise<Team> {
  const { data } = await apiClient.get<{ data: Team }>(`/teams/${id}`);
  return data.data;
}

export async function getTeamSquad(id: string): Promise<Player[]> {
  const { data } = await apiClient.get<{ data: Player[] }>(`/teams/${id}/squad`);
  return data.data;
}

export async function getTeamStandings(id: string): Promise<TeamStandingsItem[]> {
  const { data } = await apiClient.get<{ data: TeamStandingsItem[] }>(`/teams/${id}/standings`);
  return data.data;
}
