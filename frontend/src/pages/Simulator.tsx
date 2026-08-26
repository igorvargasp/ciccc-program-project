import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Swords,
  History,
  Sparkles,
  Star,
  Trash2,
  Calendar,
  Trophy,
  Clock,
  MapPin,
  Plus,
  Minus,
} from "lucide-react";
import { listMatches } from "../api/matches";
import { listCompetitions } from "../api/competitions";
import { createSimulation, listSimulations } from "../api/simulations";
import { useTeamsMap } from "../hooks/useTeamsMap";
import { useAppStore } from "../store/app";
import { useAuth } from "../context/AuthContext";
import { useFavoriteTeam } from "../hooks/useFavoriteTeam";
import StandingsTable from "../components/StandingsTable";
import Button from "../components/ui/Button";
import { PageSpinner } from "../components/ui/Spinner";
import type { StandingRow, Team } from "../types";

function normalizeStandings(
  rows: unknown,
  teamsMap: Map<string, Team>,
): StandingRow[] | null {
  if (!Array.isArray(rows)) return null;
  return rows.map((row: any) => {
    if (row?.team?.id) return row as StandingRow;
    const team = teamsMap.get(row?.teamId);
    return {
      ...row,
      team: {
        id: row?.teamId,
        name: team?.name ?? row?.teamName ?? "Unknown",
        shortName: team?.shortName ?? null,
        crestUrl: team?.crestUrl ?? null,
      },
    } as StandingRow;
  });
}

export default function Simulator() {
  const { t } = useTranslation();
  const teamsMap = useTeamsMap();
  const token = useAppStore((s) => s.token);
  const { user } = useAuth();
  const qc = useQueryClient();
  const { teamId: favTeamId, competitionId: favCompetitionId } = useFavoriteTeam();

  const [activeTab, setActiveTab] = useState<
    "general" | "my-team" | "matchday"
  >("general");
  const [selectedCompetitionId, setSelectedCompetitionId] =
    useState<string>("");
  const [selectedMatchday, setSelectedMatchday] = useState<string>("");
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [resultStandings, setResultStandings] = useState<StandingRow[] | null>(
    null,
  );
  const [aiInsight, setAiInsight] = useState<any>(null);

  // Default competition to the favourite team's league once resolved
  useEffect(() => {
    if (favCompetitionId && !selectedCompetitionId) {
      setSelectedCompetitionId(favCompetitionId);
    }
  }, [favCompetitionId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch competitions
  const { data: competitions } = useQuery({
    queryKey: ["competitions"],
    queryFn: listCompetitions,
    enabled: true,
  });

  const competitionsMap = new Map(
    competitions?.map((c: any) => [c.id, c]) || [],
  );

  // Fetch ALL matches
  const { data: allMatches } = useQuery({
    queryKey: ["matches", "all-for-matchdays"],
    queryFn: () => listMatches({ limit: 300 }),
    enabled: true,
  });

  // Scheduled matches with optional competition and matchday filter
  const { data: scheduledMatches } = useQuery({
    queryKey: [
      "matches",
      {
        status: "scheduled",
        competitionId: selectedCompetitionId,
        matchday: selectedMatchday,
        limit: 100,
      },
    ],
    queryFn: () =>
      listMatches({
        status: "scheduled",
        competitionId: selectedCompetitionId || undefined,
        matchday: selectedMatchday ? Number(selectedMatchday) : undefined,
        limit: 100,
      }),
    enabled: true,
  });

  const favoriteTeamId = favTeamId || user?.favoriteTeamId || null;

  // My team scheduled matches
  const { data: myTeamMatches } = useQuery({
    queryKey: [
      "matches",
      { teamId: favoriteTeamId, status: "scheduled", limit: 20 },
    ],
    queryFn: () =>
      listMatches({ teamId: favoriteTeamId!, status: "scheduled", limit: 20 }),
    enabled: !!favoriteTeamId && activeTab === "my-team",
  });

  const { data: simulations, isLoading: loadingSims } = useQuery({
    queryKey: ["simulations"],
    queryFn: listSimulations,
    enabled: true,
  });

  const simulate = useMutation({
    mutationFn: createSimulation,
    onSuccess: (result) => {
      setResultStandings(
        normalizeStandings(result?.resultingStandings, teamsMap),
      );
      setAiInsight(result);
      qc.invalidateQueries({ queryKey: ["simulations"] });
    },
  });

  const activeMatchesList =
    activeTab === "my-team" ? myTeamMatches : scheduledMatches;

  // Extrair rodadas disponíveis de forma flexível
  const availableMatchdays = Array.from(
    new Set(
      (allMatches || [])
        .filter((m: any) => {
          if (!selectedCompetitionId) return true;
          const compId = m.competitionId || m.competition?.id;
          return String(compId) === String(selectedCompetitionId);
        })
        .map((m: any) => m.matchday || m.round)
        .filter((md: any) => md !== undefined && md !== null && !isNaN(md)),
    ),
  ).sort((a: any, b: any) => Number(a) - Number(b));

  const selectedMatch = activeMatchesList?.find(
    (m) => m.id === selectedMatchId,
  );

  const homeTeam = selectedMatch
    ? teamsMap.get(selectedMatch.homeTeamId)
    : undefined;
  const awayTeam = selectedMatch
    ? teamsMap.get(selectedMatch.awayTeamId)
    : undefined;

  const competitionInfo = selectedMatch
    ? selectedMatch.competition?.name
      ? selectedMatch.competition
      : competitionsMap.get(selectedMatch.competitionId)
    : undefined;

  const matchDate = selectedMatch?.kickoffAt;
  const matchVenue = selectedMatch?.venue || selectedMatch?.stadium;

  // Group matches by competition for the card view selector
  const matchesByCompetition = (activeMatchesList || []).reduce(
    (acc: any, m: any) => {
      const compId = m.competitionId || "other";
      if (!acc[compId]) acc[compId] = [];
      if (selectedMatchday && String(m.matchday) !== String(selectedMatchday)) {
        return acc;
      }
      acc[compId].push(m);
      return acc;
    },
    {},
  );

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
          <Swords className="w-6 h-6 text-brand" />
          {t("simulator.title")}
        </h1>
        <p className="text-muted mt-1 text-xs sm:text-sm">
          {t("simulator.description")}
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-x-auto pb-2">
        <div className="flex gap-1 bg-surface-2 rounded-xl p-1 w-full sm:w-fit border border-edge/12">
          <button
            onClick={() => {
              setActiveTab("general");
              setSelectedMatchId("");
              setResultStandings(null);
            }}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-all text-center ${
              activeTab === "general"
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t("simulator.tabs.allMatches", "All Matches")}
          </button>
          <button
            onClick={() => {
              setActiveTab("matchday");
              setSelectedMatchId("");
              setResultStandings(null);
            }}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "matchday"
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />{" "}
            {t("simulator.tabs.matchdays", "Matchdays")}
          </button>
          <button
            onClick={() => {
              setActiveTab("my-team");
              setSelectedMatchId("");
              setResultStandings(null);
            }}
            className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "my-team"
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Star className="w-3.5 h-3.5" />{" "}
            {t("simulator.tabs.myTeam", "My Team")}
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Match Selector */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface border border-edge/12 rounded-2xl p-4 sm:p-5 space-y-4 relative overflow-hidden shadow-sm">
            <h2 className="text-sm sm:text-base font-extrabold text-foreground">
              {activeTab === "matchday"
                ? t(
                    "simulator.selectMatchdayFixtures",
                    "Select Matchday Fixtures",
                  )
                : t("simulator.selectMatch", "Select Match")}
            </h2>

            {activeTab !== "my-team" && competitions && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 border-b border-edge/12">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">
                    {t("simulator.filters.competition", "Competition")}
                  </label>
                  <select
                    value={selectedCompetitionId}
                    onChange={(e) => {
                      setSelectedCompetitionId(e.target.value);
                      setSelectedMatchday("");
                      setSelectedMatchId("");
                      setResultStandings(null);
                    }}
                    className="w-full bg-surface-2 border border-edge/12 rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-brand transition-colors"
                  >
                    <option value="">
                      {t(
                        "simulator.filters.allCompetitions",
                        "All Competitions",
                      )}
                    </option>
                    {competitions.map((comp: any) => (
                      <option key={comp.id} value={comp.id}>
                        {comp.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted uppercase">
                    {t("simulator.filters.matchday", "Matchday")}
                  </label>
                  <select
                    value={selectedMatchday}
                    onChange={(e) => {
                      setSelectedMatchday(e.target.value);
                      setSelectedMatchId("");
                      setResultStandings(null);
                    }}
                    className="w-full bg-surface-2 border border-edge/12 rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-brand transition-colors"
                  >
                    <option value="">
                      {t("simulator.filters.allMatchdays", "All Matchdays")}
                    </option>
                    {availableMatchdays.map((md: any) => (
                      <option key={md} value={md}>
                        {t("simulator.filters.matchdayNumber", "Matchday")} {md}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="max-h-[500px] sm:max-h-[580px] overflow-y-auto space-y-4 pr-1">
              {Object.keys(matchesByCompetition).length === 0 ? (
                <p className="text-xs text-muted text-center py-6">
                  {t("simulator.noMatches", "No scheduled matches available.")}
                </p>
              ) : (
                Object.entries(matchesByCompetition).map(
                  ([compId, matches]: [string, any]) => {
                    const comp = competitionsMap.get(compId) as any;
                    const competitionName =
                      comp?.name ||
                      t("simulator.otherCompetitions", "Other Competitions");

                    return (
                      <div key={compId} className="space-y-2">
                        <h3 className="text-xs font-black text-foreground flex items-center gap-2 bg-surface-2 px-3 py-2 rounded-lg border border-edge/10 uppercase tracking-wider">
                          <Trophy className="w-3.5 h-3.5 text-brand" />
                          <span className="truncate">{competitionName}</span>
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                          {matches.map((m: any) => {
                            const home = teamsMap.get(m.homeTeamId);
                            const away = teamsMap.get(m.awayTeamId);
                            const isSelected = selectedMatchId === m.id;

                            return (
                              <div
                                key={m.id}
                                onClick={() => {
                                  setSelectedMatchId(m.id);
                                  setHomeScore(0);
                                  setAwayScore(0);
                                  setResultStandings(null);
                                }}
                                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 sm:gap-3 ${
                                  isSelected
                                    ? "border-brand bg-brand/5 shadow-sm"
                                    : "border-edge/12 bg-surface-2/5 hover:border-brand/40"
                                }`}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <img
                                    src={home?.crestUrl}
                                    alt=""
                                    className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0"
                                  />
                                  <span className="text-xs font-semibold truncate text-foreground">
                                    {home?.shortName || home?.name}
                                  </span>
                                </div>
                                <div className="flex flex-col items-center flex-shrink-0">
                                  <span className="text-[10px] font-bold text-muted">
                                    vs
                                  </span>
                                  {m.matchday && (
                                    <span className="text-[9px] text-muted font-medium">
                                      R.{m.matchday}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                                  <span className="text-xs font-semibold truncate text-foreground text-right">
                                    {away?.shortName || away?.name}
                                  </span>
                                  <img
                                    src={away?.crestUrl}
                                    alt=""
                                    className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  },
                )
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Simulation Control Panel & Projected Standings */}
        <div className="lg:col-span-7 space-y-6">
          {selectedMatch ? (
            <div className="bg-surface border border-edge/12 rounded-2xl p-4 sm:p-5 space-y-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-brand" />

              {/* Competition Name Header */}
              <div className="flex items-center gap-2 pb-2 border-b border-edge/12 text-xs font-bold text-foreground">
                <Trophy className="w-4 h-4 text-brand" />
                <span className="truncate">
                  {competitionInfo?.name ||
                    t("simulator.championship", "Championship")}
                </span>
                {selectedMatch.matchday && (
                  <span className="text-muted font-normal whitespace-nowrap">
                    • {t("simulator.filters.matchday", "Matchday")}{" "}
                    {selectedMatch.matchday}
                  </span>
                )}
              </div>

              {/* Score Control Board */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                {/* Home Team */}
                <div className="flex flex-col items-center gap-2 w-full sm:flex-1">
                  <img
                    src={homeTeam?.crestUrl}
                    alt=""
                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                  />
                  <span className="text-xs font-bold text-foreground text-center line-clamp-1">
                    {homeTeam?.name || homeTeam?.shortName}
                  </span>

                  <div className="flex items-center bg-surface-2 border border-edge/12 rounded-xl p-1">
                    <button
                      onClick={() => setHomeScore(Math.max(0, homeScore - 1))}
                      className="w-8 h-8 flex items-center justify-center bg-surface hover:bg-brand/10 text-foreground rounded-lg transition-colors shadow-2xs"
                      aria-label="Diminuir gols da casa"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-lg font-black text-foreground">
                      {homeScore}
                    </span>
                    <button
                      onClick={() => setHomeScore(Math.min(50, homeScore + 1))}
                      className="w-8 h-8 flex items-center justify-center bg-surface hover:bg-brand/10 text-foreground rounded-lg transition-colors shadow-2xs"
                      aria-label="Aumentar gols da casa"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Central Info: VS + Date, Time & Venue below */}
                <div className="flex flex-col items-center justify-center px-2 gap-1.5 order-first sm:order-none">
                  <span className="hidden sm:inline text-muted font-black text-xl italic tracking-wider">
                    VS
                  </span>

                  <div className="flex flex-col items-center text-[10px] text-muted space-y-1 bg-surface-2 px-3 py-2 rounded-lg border border-edge/10 w-full sm:w-auto text-center shadow-2xs">
                    {matchDate && (
                      <div className="flex items-center justify-center gap-1.5 font-semibold text-foreground flex-wrap">
                        <Calendar className="w-3 h-3 text-brand" />
                        <span>{new Date(matchDate).toLocaleDateString()}</span>
                        <Clock className="w-3 h-3 ml-1 text-brand" />
                        <span>
                          {new Date(matchDate).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                    {matchVenue && (
                      <div className="flex items-center justify-center gap-1">
                        <MapPin className="w-3 h-3 text-brand" />
                        <span className="truncate max-w-[200px]">
                          {matchVenue}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Away Team */}
                <div className="flex flex-col items-center gap-2 w-full sm:flex-1">
                  <img
                    src={awayTeam?.crestUrl}
                    alt=""
                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                  />
                  <span className="text-xs font-bold text-foreground text-center line-clamp-1">
                    {awayTeam?.name || awayTeam?.shortName}
                  </span>

                  <div className="flex items-center bg-surface-2 border border-edge/12 rounded-xl p-1">
                    <button
                      onClick={() => setAwayScore(Math.max(0, awayScore - 1))}
                      className="w-8 h-8 flex items-center justify-center bg-surface hover:bg-brand/10 text-foreground rounded-lg transition-colors shadow-2xs"
                      aria-label="Diminuir gols visitante"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-lg font-black text-foreground">
                      {awayScore}
                    </span>
                    <button
                      onClick={() => setAwayScore(Math.min(50, awayScore + 1))}
                      className="w-8 h-8 flex items-center justify-center bg-surface hover:bg-brand/10 text-foreground rounded-lg transition-colors shadow-2xs"
                      aria-label="Aumentar gols visitante"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <Button
                loading={simulate.isPending}
                onClick={() =>
                  simulate.mutate({
                    matchId: selectedMatchId,
                    homeScore,
                    awayScore,
                  })
                }
                className="w-full"
              >
                <Swords className="w-4 h-4" />
                {simulate.isPending
                  ? t("simulator.loading", "Simulating...")
                  : t("simulator.simulate", "Run Simulation")}
              </Button>
            </div>
          ) : null}

          {/* Standings View */}
          <div className="bg-surface border border-edge/12 rounded-2xl p-4 sm:p-5 min-h-[450px] shadow-sm overflow-x-auto">
            <h2 className="text-sm sm:text-base font-extrabold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              {t("simulator.projectedStandings", "Projected Standings")}
            </h2>
            {resultStandings && resultStandings.length > 0 ? (
              <StandingsTable rows={resultStandings} />
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-center space-y-2 text-muted px-4">
                <Swords className="w-10 h-10 stroke-1 opacity-40" />
                <p className="text-xs sm:text-sm max-w-md">
                  {t(
                    "simulator.emptyStandingsPrompt",
                    "Select a match on the left, define the score above, and run the simulation to preview the updated league table.",
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Section */}
      <div className="pt-6 border-t border-edge/12">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-base sm:text-lg font-extrabold text-foreground flex items-center gap-2">
            <History className="w-5 h-5 text-muted" />
            {t("simulator.history", "Simulation History")}
          </h2>
          {simulations?.length > 0 && (
            <button
              onClick={() => {
                qc.setQueryData(["simulations"], []);
              }}
              className="text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />{" "}
              {t("simulator.clearHistory", "Clear History")}
            </button>
          )}
        </div>

        {loadingSims ? (
          <PageSpinner />
        ) : !simulations?.length ? (
          <p className="text-muted text-xs sm:text-sm">
            {t("simulator.noSimulations", "No previous simulations found.")}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {simulations.map((sim: any) => {
              const m = allMatches?.find((x: any) => x.id === sim.matchId);
              const home =
                sim.homeTeam ?? (m ? teamsMap.get(m.homeTeamId) : undefined);
              const away =
                sim.awayTeam ?? (m ? teamsMap.get(m.awayTeamId) : undefined);

              return (
                <div
                  key={sim.id}
                  className="bg-surface border border-edge/12 rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:border-brand/30 transition-colors shadow-xs"
                  onClick={() => {
                    const rows = normalizeStandings(
                      sim.resultingStandings,
                      teamsMap,
                    );
                    if (rows) setResultStandings(rows);
                  }}
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <img
                      src={home?.crestUrl || home?.logo}
                      alt=""
                      className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0"
                    />
                    <span className="text-xs font-semibold text-foreground truncate">
                      {home?.shortName || home?.name} vs{" "}
                      {away?.shortName || away?.name}
                    </span>
                    <img
                      src={away?.crestUrl || away?.logo}
                      alt=""
                      className="w-5 h-5 sm:w-6 sm:h-6 object-contain flex-shrink-0"
                    />
                  </div>
                  <div className="text-xs sm:text-sm font-black text-foreground flex-shrink-0 bg-surface-2 px-2 py-1 rounded-md">
                    {sim.simulatedHomeScore ?? 0} –{" "}
                    {sim.simulatedAwayScore ?? 0}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
