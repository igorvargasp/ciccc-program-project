import React, { useState, useEffect } from "react";

interface TeamInfo {
  id: string;
  name: string;
  shortName?: string;
  crestUrl?: string;
}

interface Match {
  id: string | number;
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  homeScore?: number | null;
  awayScore?: number | null;
  kickoffAt: string;
  status: string;
  venue?: string;
  matchday?: number;
}

interface UpcomingMatchesProps {
  teamId?: string | number;
}

export function UpcomingMatches({ teamId }: UpcomingMatchesProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;

    const fetchMatches = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
        const res = await fetch(`${baseUrl}/api/teams/${teamId}/matches`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Error fetching matches.");
        }

        setMatches(json.data || json || []);
      } catch (err: any) {
        console.error("Error fetching matches.", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMatches();
  }, [teamId]);

  if (!teamId) {
    return (
      <div className="bg-[#14171c] border border-[#414755]/30 p-6 text-center text-xs text-[#8b90a0] uppercase tracking-wider">
        Select a club to view the matches.
      </div>
    );
  }

  return (
    <div className="bg-[#14171c] border border-[#414755]/30 p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[#414755]/30 pb-3">
        <h3 className="text-xs font-black text-[#00d2fd] uppercase tracking-[0.2em] flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">event</span>
          Matches and Schedule
        </h3>
        <span className="text-[10px] text-[#8b90a0] uppercase">
          Telemetry Schedule
        </span>
      </div>

      {isLoading ? (
        <div className="py-6 text-center text-xs text-[#00d2fd] animate-pulse">
          Synchronizing the match schedule...
        </div>
      ) : error ? (
        <div className="text-xs text-red-400 p-3 bg-red-500/10 border border-red-500/20">
          {error}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-xs text-[#8b90a0] text-center py-4 uppercase">
          No matches found.
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const statusLower = match.status?.toLowerCase() || "";
            const isLive = statusLower === "live" || statusLower === "in_play";
            const isFinished =
              statusLower === "finished" || statusLower === "ft";

            return (
              <div
                key={match.id}
                className={`bg-[#0d0f12] border p-3 flex items-center justify-between transition-all ${
                  isLive
                    ? "border-[#00d2fd]/60 shadow-lg shadow-[#00d2fd]/5"
                    : "border-[#414755]/20 hover:border-[#00d2fd]/50"
                }`}
              >
                {/* Home Team */}
                <div className="flex items-center gap-3 w-[38%] justify-end">
                  <span className="text-xs font-bold uppercase truncate text-right text-[#e2e2e8]">
                    {match.homeTeam?.name}
                  </span>
                  {match.homeTeam?.crestUrl && (
                    <img
                      src={match.homeTeam.crestUrl}
                      alt=""
                      className="w-6 h-6 object-contain shrink-0"
                    />
                  )}
                </div>

                {/* Central Status / Score / Date */}
                <div className="px-2.5 py-1 bg-[#14171c] border border-[#414755]/30 flex flex-col items-center justify-center min-w-[76px]">
                  {isLive ? (
                    <>
                      <div className="flex items-center gap-1 font-mono text-xs font-bold text-[#00d2fd]">
                        <span>{match.homeScore ?? 0}</span>
                        <span>-</span>
                        <span>{match.awayScore ?? 0}</span>
                      </div>
                      <span className="text-[9px] font-black text-emerald-400 uppercase tracking-tighter animate-pulse">
                        AO VIVO
                      </span>
                    </>
                  ) : isFinished ? (
                    <>
                      <div className="flex items-center gap-1 font-mono text-xs font-bold text-[#e2e2e8]">
                        <span>{match.homeScore ?? 0}</span>
                        <span>-</span>
                        <span>{match.awayScore ?? 0}</span>
                      </div>
                      <span className="text-[9px] text-[#8b90a0] uppercase tracking-tighter">
                        Closed
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] font-mono text-[#00d2fd]">
                      {match.kickoffAt
                        ? new Date(match.kickoffAt).toLocaleDateString([], {
                            day: "2-digit",
                            month: "2-digit",
                          })
                        : "TBD"}
                    </span>
                  )}
                </div>

                {/* Away Team */}
                <div className="flex items-center gap-3 w-[38%]">
                  {match.awayTeam?.crestUrl && (
                    <img
                      src={match.awayTeam.crestUrl}
                      alt=""
                      className="w-6 h-6 object-contain shrink-0"
                    />
                  )}
                  <span className="text-xs font-bold uppercase truncate text-[#e2e2e8]">
                    {match.awayTeam?.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
