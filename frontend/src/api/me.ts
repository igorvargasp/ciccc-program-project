import { apiClient } from './client';
import type { User, UserPreferences } from '../types';

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<{ data: User }>('/me');
  return data.data;
}

export async function updatePreferences(
  patch: Partial<Pick<UserPreferences, 'theme' | 'notifyMatches' | 'notifyTeamNews'>> & {
    languageId?: string | null;
  },
): Promise<UserPreferences> {
  const { data } = await apiClient.put<{ data: UserPreferences }>('/me/preferences', patch);
  return data.data;
}
