import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { listMatches } from "@/api/matches";
import { listCompetitions } from "@/api/competitions";
import MatchCard from "@/components/MatchCard";
import CompetitionPills from "@/components/CompetitionPills";
import { SkeletonCard } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import {
  Star,
  Layers,
  Trophy,
  Radio,
  Clock,
  History,
  ChevronRight,
} from "lucide-react";
import { useTeamsMap } from "@/hooks/useTeamsMap";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

type ViewMode = "status" | "my-team";
type StatusFilter = "live" | "scheduled" | "finished";

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "live", label: "matches.live" },
  { key: "scheduled", label: "matches.upcoming" },
  { key: "finished", label: "matches.finished" },
];

export default function Matches() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<ViewMode>("status");
  const [status, setStatus] = useState<StatusFilter>("scheduled");
  const [competitionId, setCompetitionId] = useState<string | undefined>(
    undefined,
  );
  const [matchday, setMatchday] = useState<string | undefined>(undefined);

  const [nextLimit, setNextLimit] = useState(6);
  const [resultsLimit, setResultsLimit] = useState(6);

  const teamsMap = useTeamsMap();

  const [favoriteTeam, setFavoriteTeam] = useState<{
    id: string | number;
    name: string;
    competitionId?: string | number;
  } | null>(() => {
    const saved = localStorage.getItem("favorite_team");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    const handleFavoriteChange = () => {
      const saved = localStorage.getItem("favorite_team");
      if (saved) {
        try {
          setFavoriteTeam(JSON.parse(saved));
        } catch {
          setFavoriteTeam(null);
        }
      } else {
        setFavoriteTeam(null);
      }
    };

    window.addEventListener("favoriteTeamChanged", handleFavoriteChange);
    return () => {
      window.removeEventListener("favoriteTeamChanged", handleFavoriteChange);
    };
  }, []);

  const selectedTeamId = favoriteTeam?.id || user?.favoriteTeamId;

  const teamObj = selectedTeamId ? teamsMap.get(String(selectedTeamId)) : null;
  const teamCompetitionId = String(
    favoriteTeam?.competitionId ||
      (teamObj as any)?.competitionId ||
      (teamObj as any)?.leagueId ||
      "",
  );

  const shouldShowMyTeamButton =
    selectedTeamId &&
    (!competitionId ||
      (teamCompetitionId && String(competitionId) === teamCompetitionId));

  const { data: competitionsData } = useQuery({
    queryKey: ["competitions"],
    queryFn: listCompetitions,
    staleTime: 10 * 60_000,
  });

  const competitionsMap = new Map<string, any>();
  if (competitionsData && Array.isArray(competitionsData)) {
    competitionsData.forEach((comp: any) => {
      competitionsMap.set(String(comp.id), comp);
      if (comp.code) competitionsMap.set(String(comp.code), comp);
    });
  }

  const { data: matches, isLoading } = useQuery({
    queryKey: [
      "matches",
      { viewMode, selectedTeamId, status, competitionId, matchday },
    ],
    queryFn: async () => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

      if (viewMode === "my-team") {
        if (!selectedTeamId) return [];
        const res = await fetch(
          `${baseUrl}/api/teams/${selectedTeamId}/matches`,
        );
        const json = await res.json();
        if (!res.ok)
          throw new Error(json.error || "Error fetching team matches.");

        let data = (json.data || json || []) as any[];
        if (matchday) {
          data = data.filter(
            (m: any) => String(m.matchday || m.round) === matchday,
          );
        }
        return data;
      }

      return listMatches({
        status,
        competitionId,
        matchday: matchday ? Number(matchday) : undefined,
        limit: 100,
        from: status === "scheduled" ? new Date().toISOString() : undefined,
      });
    },
    refetchInterval:
      status === "live" || viewMode === "my-team" ? 30_000 : undefined,
  });

  const selectedCompObj = competitionsData?.find(
    (c) => String(c.id) === String(competitionId),
  );
  const activeCompetitionName = selectedCompObj?.name;
  const competitionFlag = selectedCompObj?.logoUrl;

  useEffect(() => {
    setMatchday(undefined);
  }, [competitionId, viewMode]);

  useEffect(() => {
    if (viewMode === "my-team") {
      setNextLimit(6);
      setResultsLimit(6);
    }
  }, [viewMode]);

  const resolveCompetitionInfo = (m: any) => {
    const rawCompId =
      m.competitionId ||
      m.competition?.id ||
      m.leagueId ||
      m.competition_id ||
      "other";

    const compFromMap = competitionsMap.get(String(rawCompId));

    const compName =
      m.competition?.name ||
      m.competitionName ||
      m.competition_name ||
      compFromMap?.name ||
      (rawCompId !== "other"
        ? `Competition ${rawCompId}`
        : t("matches.otherCompetitions", "Other Competitions"));

    return { compId: String(rawCompId), compName };
  };

  const groupMatchesByCompetition = (matchList: any[]) => {
    const groups = new Map<
      string,
      { id: string; competitionName: string; logoUrl?: string; matches: any[] }
    >();

    matchList.forEach((m) => {
      const { compId, compName } = resolveCompetitionInfo(m);

      if (!groups.has(compId)) {
        groups.set(compId, {
          id: compId,
          competitionName: compName,
          logoUrl:
            m.competition?.logoUrl ?? competitionsMap.get(compId)?.logoUrl,
          matches: [],
        });
      }
      groups.get(compId)!.matches.push(m);
    });

    return [...groups.values()].map((g) => {
      const window = g.matches.slice(0, 10);
      const tally = new Map<number, number>();
      for (const m of window) {
        if (typeof m.matchday === "number") {
          tally.set(m.matchday, (tally.get(m.matchday) ?? 0) + 1);
        }
      }
      const round =
        [...tally.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

      const narrow = status !== "live" && round !== null;
      const shown = narrow
        ? g.matches.filter((m) => m.matchday === round)
        : g.matches;

      return {
        ...g,
        round: narrow ? round : null,
        shown,
        total: g.matches.length,
      };
    });
  };

  const groupFinishedMatchesByRound = (matchList: any[]) => {
    const groups: {
      [key: string]: { round: string; competitionName: string; matches: any[] };
    } = {};

    matchList.forEach((m) => {
      const round = String(m.matchday || m.round || "N/A");
      const { compId, compName } = resolveCompetitionInfo(m);
      const groupKey = `${compId}-${round}`;

      if (!groups[groupKey]) {
        groups[groupKey] = {
          round,
          competitionName: compName,
          matches: [],
        };
      }
      groups[groupKey].matches.push(m);
    });

    return Object.values(groups).sort((a, b) => {
      if (a.competitionName !== b.competitionName) {
        return a.competitionName.localeCompare(b.competitionName);
      }
      return b.round.localeCompare(a.round, undefined, { numeric: true });
    });
  };

  const groupedMatches =
    !competitionId && matches && Array.isArray(matches)
      ? groupMatchesByCompetition(matches)
      : [];

  const groupedFinishedMatches =
    status === "finished" &&
    viewMode === "status" &&
    matches &&
    Array.isArray(matches)
      ? groupFinishedMatchesByRound(matches)
      : [];

  const myTeamLiveMatches =
    viewMode === "my-team" && Array.isArray(matches)
      ? matches.filter(
          (m: any) => m.status === "live" || m.isLive || m.status === "IN_PLAY",
        )
      : [];

  const myTeamUpcomingMatches =
    viewMode === "my-team" && Array.isArray(matches)
      ? matches.filter(
          (m: any) =>
            m.status === "scheduled" ||
            m.status === "TIMED" ||
            m.status === "UPCOMING" ||
            (!m.status && new Date(m.date || m.utcDate) > new Date()),
        )
      : [];

  const myTeamFinishedMatches =
    viewMode === "my-team" && Array.isArray(matches)
      ? matches.filter(
          (m: any) =>
            m.status === "finished" ||
            m.status === "FT" ||
            m.status === "FINISHED",
        )
      : [];

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">
            {t("matches.title", "Matches and Schedule")}
          </h1>
          {favoriteTeam && viewMode === "my-team" && (
            <p className="text-xs text-[#00d2fd] font-bold uppercase tracking-wider mt-1">
              {t("matches.showingTeam", "Showing fixtures for:")}{" "}
              {favoriteTeam.name}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {viewMode === "status" && (
          <div className="flex-1 w-full overflow-x-auto pb-1">
            <CompetitionPills
              value={competitionId}
              onChange={setCompetitionId}
            />
          </div>
        )}

        {competitionId && viewMode === "status" && (
          <div className="relative flex items-center w-full sm:w-auto min-w-[180px]">
            <div className="absolute left-3 text-[#00d2fd] pointer-events-none flex items-center">
              <Layers className="w-4 h-4" />
            </div>
            <select
              value={matchday || ""}
              onChange={(e) => setMatchday(e.target.value || undefined)}
              className="w-full bg-[#14171c] border border-[#414755]/40 rounded-xl pl-9 pr-8 py-2.5 text-xs font-bold text-foreground focus:outline-none focus:border-[#00d2fd] transition-all cursor-pointer appearance-none shadow-md hover:border-[#414755]"
            >
              <option value="">{t("matches.allRounds", "All Rounds")}</option>
              {Array.from({ length: 38 }, (_, i) => i + 1).map((round) => (
                <option key={round} value={round}>
                  {t("matches.round", "Round")} {round}
                </option>
              ))}
            </select>
            <div className="absolute right-3 pointer-events-none text-[#8b90a0] text-xs">
              ▼
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#14171c] border border-[#414755]/30 p-4 sm:p-6 space-y-4 rounded-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#414755]/30 pb-3">
          <h3 className="text-xs font-black text-[#00d2fd] uppercase tracking-[0.2em] flex items-center gap-2 truncate">
            {viewMode === "my-team" ? (
              <Star className="w-4 h-4 text-amber-400 fill-current shrink-0" />
            ) : competitionId && competitionFlag ? (
              <img
                src={competitionFlag}
                alt=""
                className="w-4 h-4 object-contain rounded-full shrink-0"
              />
            ) : (
              <Trophy className="w-4 h-4 text-[#00d2fd] shrink-0" />
            )}

            <span className="truncate">
              {viewMode === "my-team"
                ? `${favoriteTeam?.name || t("matches.myTeam", "My Team")} Dashboard`
                : competitionId && activeCompetitionName
                  ? activeCompetitionName
                  : t("matches.scheduleTitle", "Schedule")}
            </span>
          </h3>

          <div className="flex flex-wrap items-center gap-1.5 bg-surface-2 rounded-xl p-1 w-full sm:w-auto overflow-x-auto">
            {STATUS_TABS.map(({ key, label }) => {
              const isActive = viewMode === "status" && status === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setViewMode("status");
                    setStatus(key);
                  }}
                  className={cn(
                    "flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap",
                    isActive
                      ? "bg-[#00d2fd] text-black"
                      : "text-[#8b90a0] hover:text-foreground",
                  )}
                >
                  {key === "live" && isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                  )}
                  {t(label, key)}
                </button>
              );
            })}

            {shouldShowMyTeamButton && (
              <>
                <div className="w-[1px] h-4 bg-[#414755]/50 mx-0.5 hidden sm:block" />
                <button
                  onClick={() => setViewMode("my-team")}
                  className={cn(
                    "flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap",
                    viewMode === "my-team"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg"
                      : "text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10",
                  )}
                >
                  <Star className="w-3.5 h-3.5 fill-current shrink-0" />
                  <span>{t("matches.myTeam", "My Team")}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* PAGE CONTENT */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : viewMode === "my-team" ? (
          <div className="space-y-10">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#414755]/20 pb-2">
                <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                <h4 className="text-sm font-black text-foreground uppercase tracking-wider">
                  {t("matches.liveMatch", "Live Match")}
                </h4>
              </div>

              {myTeamLiveMatches.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {myTeamLiveMatches.map((m: any) => {
                    const homeTeamObj =
                      typeof m.homeTeam === "object"
                        ? m.homeTeam
                        : teamsMap.get(m.homeTeamId);
                    const awayTeamObj =
                      typeof m.awayTeam === "object"
                        ? m.awayTeam
                        : teamsMap.get(m.awayTeamId);
                    return (
                      <MatchCard
                        key={m.id}
                        match={m}
                        homeTeam={homeTeamObj}
                        awayTeam={awayTeamObj}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="bg-[#1a1f29]/60 border border-[#414755]/20 rounded-xl p-6 text-center space-y-2">
                  <p className="text-xs font-medium text-[#8b90a0]">
                    {t(
                      "matches.noLiveTeamMatches",
                      "Your team is not currently participating in any live matches.",
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#414755]/20 pb-2">
                <Clock className="w-4 h-4 text-[#00d2fd]" />
                <h4 className="text-sm font-black text-foreground uppercase tracking-wider">
                  {t("matches.nextMatches", "Next Matches")}
                </h4>
              </div>

              {myTeamUpcomingMatches.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {myTeamUpcomingMatches.slice(0, nextLimit).map((m: any) => {
                      const homeTeamObj =
                        typeof m.homeTeam === "object"
                          ? m.homeTeam
                          : teamsMap.get(m.homeTeamId);
                      const awayTeamObj =
                        typeof m.awayTeam === "object"
                          ? m.awayTeam
                          : teamsMap.get(m.awayTeamId);
                      return (
                        <MatchCard
                          key={m.id}
                          match={m}
                          homeTeam={homeTeamObj}
                          awayTeam={awayTeamObj}
                        />
                      );
                    })}
                  </div>

                  {(nextLimit < myTeamUpcomingMatches.length ||
                    nextLimit > 6) && (
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                      {nextLimit < myTeamUpcomingMatches.length && (
                        <button
                          onClick={() => setNextLimit((prev) => prev + 6)}
                          className="px-5 py-2 text-xs font-bold bg-[#414755]/20 hover:bg-[#414755]/40 text-foreground rounded-xl transition-all border border-[#414755]/30 cursor-pointer"
                        >
                          {t("common.showMore", "Show More")}
                        </button>
                      )}
                      {nextLimit > 6 && (
                        <button
                          onClick={() => setNextLimit(6)}
                          className="px-5 py-2 text-xs font-bold bg-[#414755]/20 hover:bg-[#414755]/40 text-foreground rounded-xl transition-all border border-[#414755]/30 cursor-pointer"
                        >
                          {t("common.showLess", "Show Less")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#8b90a0] py-2">
                  {t(
                    "matches.noUpcomingMatches",
                    "No upcoming matches scheduled.",
                  )}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#414755]/20 pb-2">
                <History className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-black text-foreground uppercase tracking-wider">
                  {t("matches.results", "Results")}
                </h4>
              </div>

              {myTeamFinishedMatches.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {myTeamFinishedMatches
                      .slice(0, resultsLimit)
                      .map((m: any) => {
                        const homeTeamObj =
                          typeof m.homeTeam === "object"
                            ? m.homeTeam
                            : teamsMap.get(m.homeTeamId);
                        const awayTeamObj =
                          typeof m.awayTeam === "object"
                            ? m.awayTeam
                            : teamsMap.get(m.awayTeamId);
                        return (
                          <MatchCard
                            key={m.id}
                            match={m}
                            homeTeam={homeTeamObj}
                            awayTeam={awayTeamObj}
                          />
                        );
                      })}
                  </div>

                  {(resultsLimit < myTeamFinishedMatches.length ||
                    resultsLimit > 6) && (
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                      {resultsLimit < myTeamFinishedMatches.length && (
                        <button
                          onClick={() => setResultsLimit((prev) => prev + 6)}
                          className="px-5 py-2 text-xs font-bold bg-[#414755]/20 hover:bg-[#414755]/40 text-foreground rounded-xl transition-all border border-[#414755]/30 cursor-pointer"
                        >
                          {t("common.showMore", "Show More")}
                        </button>
                      )}
                      {resultsLimit > 6 && (
                        <button
                          onClick={() => setResultsLimit(6)}
                          className="px-5 py-2 text-xs font-bold bg-[#414755]/20 hover:bg-[#414755]/40 text-foreground rounded-xl transition-all border border-[#414755]/30 cursor-pointer"
                        >
                          {t("common.showLess", "Show Less")}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#8b90a0] py-2">
                  {t("matches.noFinishedMatches", "No finished matches found.")}
                </p>
              )}
            </div>
          </div>
        ) : !matches?.length ? (
          <EmptyState
            icon={<Trophy className="w-10 h-10 text-[#8b90a0]" />}
            title={t("matches.noMatches", "No matches found.")}
          />
        ) : status === "finished" && viewMode === "status" ? (
          <div className="space-y-8">
            {groupedFinishedMatches.map((group, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex items-center gap-2 bg-[#1a1f29] px-4 py-2 rounded-lg border border-[#414755]/20">
                  <History className="w-4 h-4 text-amber-400 shrink-0" />
                  <h4 className="text-xs font-black text-foreground uppercase tracking-widest truncate">
                    {group.competitionName} - {t("matches.round", "Round")}{" "}
                    {group.round}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.matches.map((m) => {
                    const homeTeamObj =
                      typeof m.homeTeam === "object"
                        ? m.homeTeam
                        : teamsMap.get(m.homeTeamId);
                    const awayTeamObj =
                      typeof m.awayTeam === "object"
                        ? m.awayTeam
                        : teamsMap.get(m.awayTeamId);

                    return (
                      <MatchCard
                        key={m.id}
                        match={m}
                        homeTeam={homeTeamObj}
                        awayTeam={awayTeamObj}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : !competitionId && viewMode === "status" ? (
          <div className="space-y-8">
            {groupedMatches.map((group) => (
              <div key={group.id} className="space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-[#414755]/20 pb-2 pt-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {group.logoUrl ? (
                      <img
                        src={group.logoUrl}
                        alt={group.competitionName}
                        className="w-4 h-4 object-contain flex-shrink-0"
                      />
                    ) : (
                      <Trophy className="w-4 h-4 text-[#00d2fd] flex-shrink-0" />
                    )}
                    <h4 className="text-sm font-black text-foreground uppercase tracking-wider truncate">
                      {group.competitionName}
                    </h4>
                    {group.round !== null && (
                      <span className="text-xs font-semibold text-[#00d2fd] flex-shrink-0">
                        · {t("matches.round", "Round")} {group.round}
                      </span>
                    )}
                  </div>

                  {group.total > group.shown.length && (
                    <button
                      onClick={() => {
                        setCompetitionId(group.id);
                        setMatchday(undefined);
                      }}
                      className="text-xs font-semibold text-muted hover:text-[#00d2fd] flex items-center gap-1 flex-shrink-0 transition-colors"
                    >
                      {t("common.seeAll", "See more")} (
                      {group.total - group.shown.length})
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.shown.map((m) => {
                    const homeTeamObj =
                      typeof m.homeTeam === "object"
                        ? m.homeTeam
                        : teamsMap.get(m.homeTeamId);
                    const awayTeamObj =
                      typeof m.awayTeam === "object"
                        ? m.awayTeam
                        : teamsMap.get(m.awayTeamId);

                    return (
                      <MatchCard
                        key={m.id}
                        match={m}
                        homeTeam={homeTeamObj}
                        awayTeam={awayTeamObj}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {matches.map((m) => {
              const homeTeamObj =
                typeof m.homeTeam === "object"
                  ? m.homeTeam
                  : teamsMap.get(m.homeTeamId);
              const awayTeamObj =
                typeof m.awayTeam === "object"
                  ? m.awayTeam
                  : teamsMap.get(m.awayTeamId);

              return (
                <MatchCard
                  key={m.id}
                  match={m}
                  homeTeam={homeTeamObj}
                  awayTeam={awayTeamObj}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
