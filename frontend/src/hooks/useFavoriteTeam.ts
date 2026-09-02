import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTeamStandings } from '../api/teams';

export interface StoredFavoriteTeam {
  id: string | number;
  name: string;
  badgeUrl?: string;
  crestUrl?: string;
  country?: string;
  competitionId?: string;
}

export interface FavoriteTeamResult {
  team: StoredFavoriteTeam | null;
  teamId: string | null;
  /** The primary competition (league) the team participates in. */
  competitionId: string | null;
  isLoading: boolean;
}

function readStored(): StoredFavoriteTeam | null {
  const raw = localStorage.getItem('favorite_team');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredFavoriteTeam;
  } catch {
    return null;
  }
}

/**
 * Returns the signed-in user's favourite team and its primary competition.
 * The competitionId is sourced from localStorage when available (saved by
 * SelectFavoriteTeamModal) and falls back to the standings API otherwise.
 */
export function useFavoriteTeam(): FavoriteTeamResult {
  const [team, setTeam] = useState<StoredFavoriteTeam | null>(readStored);

  useEffect(() => {
    const onChanged = () => setTeam(readStored());
    window.addEventListener('favoriteTeamChanged', onChanged);
    return () => window.removeEventListener('favoriteTeamChanged', onChanged);
  }, []);

  const teamId = team?.id != null ? String(team.id) : null;
  const storedCompetitionId = team?.competitionId ?? null;

  // Only fetch from API when competitionId was not saved locally
  const { data: standings, isLoading } = useQuery({
    queryKey: ['team-standings-for-filter', teamId],
    queryFn: () => getTeamStandings(teamId!),
    enabled: !!teamId && !storedCompetitionId,
    staleTime: 10 * 60_000,
    select: (data) => {
      const current = data.find((s) => s.isCurrent);
      return (current ?? data[0])?.competition?.id ?? null;
    },
  });

  const competitionId = storedCompetitionId ?? standings ?? null;

  return {
    team,
    teamId,
    competitionId,
    isLoading: !!teamId && !storedCompetitionId && isLoading,
  };
}
