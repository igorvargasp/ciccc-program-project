import { apiClient } from './client';
import type { Notification } from '../types';

export async function listNotifications(params?: {
  unreadOnly?: boolean;
  limit?: number;
}): Promise<Notification[]> {
  const { data } = await apiClient.get<{ data: Notification[] }>('/notifications', { params });
  return data.data;
}

export async function markNotificationRead(id: string): Promise<Notification> {
  const { data } = await apiClient.post<{ data: Notification }>(`/notifications/${id}/read`);
  return data.data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post('/notifications/read-all');
}
