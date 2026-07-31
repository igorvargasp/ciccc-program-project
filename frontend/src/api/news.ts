import { apiClient } from './client';
import type { NewsArticle } from '../types';

export interface ListNewsParams {
  teamId?: string;
  limit?: number;
}

export async function listNews(params?: ListNewsParams): Promise<NewsArticle[]> {
  const { data } = await apiClient.get<{ data: NewsArticle[] }>('/news', { params });
  return data.data;
}
