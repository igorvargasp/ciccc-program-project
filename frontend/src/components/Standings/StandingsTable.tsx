import React, { useState, useEffect } from "react";

interface StandingTeam {
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  team: {
    id: string;
    name: string;
    shortName?: string;
    crestUrl?: string;
  };
}

interface CompetitionStanding {
  competition: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  seasonId: string;
  label: string;
  isCurrent: boolean;
  table: StandingTeam[];
}

interface StandingsProps {
  teamId?: string | number;
}

export function StandingsTable({ teamId }: StandingsProps) {
  const [standingsData, setStandingsData] = useState<CompetitionStanding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;

    const fetchStandings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const baseUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
        const res = await fetch(`${baseUrl}/api/teams/${teamId}/standings`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Error fetching the standings table.");
        }

        setStandingsData(json.data || []);
      } catch (err: any) {
        console.error("Error fetching the standings table.", err);
        setError(err.message || "Unknown error while loading data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStandings();
  }, [teamId]);

  if (!teamId) {
    return (
      <div className="bg-[#14171c] border border-[#414755]/30 p-6 text-center text-xs text-[#8b90a0]">
        Select a team to view the standings.
      </div>
    );
  }

  console.log("Estado atual do standingsData:", standingsData);
  return (
    <div className="bg-[#14171c] border border-[#414755]/30 p-6 space-y-6 rounded-lg shadow-xl">
      <div className="flex items-center justify-between border-b border-[#414755]/30 pb-3">
        <h3 className="text-xs font-black text-[#4b8eff] uppercase tracking-[0.2em] flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">leaderboard</span>
          Standings Table
        </h3>
        <span className="text-[10px] text-[#8b90a0] uppercase">
          League Standings
        </span>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-xs text-[#4b8eff] animate-pulse">
          Calculating the league matrix...
        </div>
      ) : error ? (
        <div className="text-xs text-red-400 p-3 bg-red-500/10 border border-red-500/20 rounded">
          {error}
        </div>
      ) : standingsData.length === 0 ? (
        <div className="text-xs text-[#8b90a0] text-center py-8">
          No standings found for this team.
        </div>
      ) : (
        standingsData.map((compGroup, groupIdx) => (
          <div key={compGroup.seasonId || groupIdx} className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#e2e2e8] font-bold px-1">
              <span className="flex items-center gap-2">
                {compGroup.competition.logoUrl && (
                  <img
                    src={compGroup.competition.logoUrl}
                    alt=""
                    className="w-4 h-4 object-contain"
                  />
                )}
                {compGroup.competition.name} ({compGroup.label})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#414755]/30 text-[#8b90a0] uppercase text-[10px]">
                    <th className="py-2 px-2">#</th>
                    <th className="py-2 px-2">Clube</th>
                    <th className="py-2 px-2 text-center">J</th>
                    <th className="py-2 px-2 text-center hidden sm:table-cell">
                      V
                    </th>
                    <th className="py-2 px-2 text-center hidden sm:table-cell">
                      E
                    </th>
                    <th className="py-2 px-2 text-center hidden sm:table-cell">
                      D
                    </th>
                    <th className="py-2 px-2 text-center">SG</th>
                    <th className="py-2 px-2 text-right">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#414755]/10 font-mono">
                  {compGroup.table.map((row, index) => {
                    const goalDiff =
                      (row.goalsFor ?? 0) - (row.goalsAgainst ?? 0);
                    const isCurrentTeam =
                      String(row.team.id) === String(teamId);

                    return (
                      <tr
                        key={row.team.id ?? index}
                        className={`hover:bg-[#0d0f12]/60 transition-colors ${
                          isCurrentTeam ? "bg-[#4b8eff]/10" : ""
                        }`}
                      >
                        <td className="py-2.5 px-2 font-bold text-[#00d2fd]">
                          {row.position}
                        </td>
                        <td className="py-2.5 px-2 flex items-center gap-2 font-sans uppercase font-bold">
                          {row.team.crestUrl && (
                            <img
                              src={row.team.crestUrl}
                              alt=""
                              className="w-4 h-4 object-contain"
                            />
                          )}
                          <span className="truncate max-w-[110px] sm:max-w-xs text-[#e2e2e8]">
                            {row.team.name}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center text-[#8b90a0]">
                          {row.played}
                        </td>
                        <td className="py-2.5 px-2 text-center text-[#8b90a0] hidden sm:table-cell">
                          {row.won ?? "-"}
                        </td>
                        <td className="py-2.5 px-2 text-center text-[#8b90a0] hidden sm:table-cell">
                          {row.drawn ?? "-"}
                        </td>
                        <td className="py-2.5 px-2 text-center text-[#8b90a0] hidden sm:table-cell">
                          {row.lost ?? "-"}
                        </td>
                        <td className="py-2.5 px-2 text-center text-[#8b90a0]">
                          {goalDiff > 0 ? `+${goalDiff}` : goalDiff}
                        </td>
                        <td className="py-2.5 px-2 text-right font-bold text-[#e2e2e8]">
                          {row.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
