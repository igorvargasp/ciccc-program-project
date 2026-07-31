import { apiClient } from './client';
import type { FavoriteTeam } from '../types';

export async function listFavorites(): Promise<FavoriteTeam[]> {
  const { data } = await apiClient.get<{ data: FavoriteTeam[] }>('/favorites');
  return data.data;
}

export async function addFavorite(teamId: string, isPrimary = false): Promise<FavoriteTeam> {
  const { data } = await apiClient.post<{ data: FavoriteTeam }>('/favorites', {
    teamId,
    isPrimary,
  });
  return data.data;
}

export async function removeFavorite(teamId: string): Promise<void> {
  await apiClient.delete(`/favorites/${teamId}`);
}
