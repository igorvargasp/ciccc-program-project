import { apiClient } from './client';
import type { Player, PlayerStatistics } from '../types';

export interface ListPlayersParams {
  search?: string;
  position?: 'GK' | 'DEF' | 'MID' | 'FWD';
  teamId?: string;
  limit?: number;
}

export async function listPlayers(params?: ListPlayersParams): Promise<Player[]> {
  const { data } = await apiClient.get<{ data: Player[] }>('/players', { params });
  return data.data;
}

export async function getPlayer(
  id: string,
): Promise<Player & { statistics: PlayerStatistics[] }> {
  const { data } = await apiClient.get<{
    data: Player & { statistics: PlayerStatistics[] };
  }>(`/players/${id}`);
  return data.data;
}
