import { useQuery } from "@tanstack/react-query";
import { listTeams } from "../api/teams";
import type { Team } from "../types";

/** Returns a Map<teamId, Team> — fetched once and cached globally. */
export function useTeamsMap(): Map<string, Team> {
  const { data } = useQuery({
    queryKey: ["teams", { limit: 100 }],
    queryFn: () => listTeams({ limit: 100 }),
    staleTime: 5 * 60_000,
  });

  if (!data) return new Map();
  return new Map(data.map((t) => [t.id, t]));
}
