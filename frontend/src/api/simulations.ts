import { apiClient } from './client';
import type { Simulation } from '../types';

export interface SimulationResult extends Simulation {
  resultingStandings: Simulation['resultingStandings'];
}

export async function createSimulation(params: {
  matchId: string;
  homeScore: number;
  awayScore: number;
}): Promise<SimulationResult> {
  const { data } = await apiClient.post<{ data: SimulationResult }>('/simulations', params);
  return data.data;
}

export async function listSimulations(): Promise<Simulation[]> {
  const { data } = await apiClient.get<{ data: Simulation[] }>('/simulations');
  return data.data;
}
