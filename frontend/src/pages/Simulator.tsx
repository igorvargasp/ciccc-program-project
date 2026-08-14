import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Swords, History, Sparkles, Activity, Star } from "lucide-react";
import { listMatches } from "../api/matches";
import { listCompetitions } from "../api/competitions";
import { createSimulation, listSimulations } from "../api/simulations";
import { useTeamsMap } from "../hooks/useTeamsMap";
import { useAppStore } from "../store/app";
import { useAuth } from "../context/AuthContext";
import StandingsTable from "../components/StandingsTable";
import Button from "../components/ui/Button";
import { PageSpinner } from "../components/ui/Spinner";
import { formatMatchDay, formatKickoff } from "../lib/utils";
import type { StandingRow, Team } from "../types";

/**
 * Simulations stored before the table shape was unified hold flat rows
 * (`{ teamId, teamName }`); StandingsTable reads `row.team`. Lift those into the
 * current shape so old history entries still render.
 */
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

  const [activeTab, setActiveTab] = useState<"general" | "my-team">("general");
  const [selectedCompetitionId, setSelectedCompetitionId] =
    useState<string>("");

  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [resultStandings, setResultStandings] = useState<StandingRow[] | null>(
    null,
  );
  const [aiInsight, setAiInsight] = useState<any>(null);

  // Fetch competitions for filtering
  const { data: competitions } = useQuery({
    queryKey: ["competitions"],
    queryFn: listCompetitions,
    enabled: true,
  });

  // Fetch ALL matches to ensure history mapping works and doesn't show "? vs ?"
  const { data: allMatches } = useQuery({
    queryKey: ["matches", "all"],
    queryFn: () => listMatches({ limit: 200 }),
    enabled: true,
  });

  // General scheduled matches with optional competition filter
  const { data: scheduledMatches } = useQuery({
    queryKey: [
      "matches",
      { status: "scheduled", competitionId: selectedCompetitionId, limit: 50 },
    ],
    queryFn: () =>
      listMatches({
        status: "scheduled",
        competitionId: selectedCompetitionId || undefined,
        limit: 50,
      }),
    enabled: true,
  });

  const rawFavoriteTeamId =
    user?.favoriteTeamId || localStorage.getItem("favorite_team_id");
  const favoriteTeamId = rawFavoriteTeamId ? String(rawFavoriteTeamId) : null;

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
  const selectedMatch = activeMatchesList?.find(
    (m) => m.id === selectedMatchId,
  );
  const homeTeam = selectedMatch
    ? teamsMap.get(selectedMatch.homeTeamId)
    : undefined;
  const awayTeam = selectedMatch
    ? teamsMap.get(selectedMatch.awayTeamId)
    : undefined;

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Swords className="w-6 h-6 text-brand" />
          {t("simulator.title")}
        </h1>
        <p className="text-muted mt-1 text-sm">{t("simulator.description")}</p>
      </div>

      {/* Mode Tabs & Competition Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-1 bg-surface-2 rounded-xl p-1 w-fit border border-edge/12">
          <button
            onClick={() => {
              setActiveTab("general");
              setSelectedMatchId("");
              setResultStandings(null);
              setAiInsight(null);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "general"
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            All Matches
          </button>
          <button
            onClick={() => {
              setActiveTab("my-team");
              setSelectedMatchId("");
              setResultStandings(null);
              setAiInsight(null);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "my-team"
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Star className="w-3.5 h-3.5" /> My Team Simulator
          </button>
        </div>

        {/* Competition Filter Selector */}
        {activeTab === "general" && competitions && (
          <div className="flex items-center gap-2">
            <select
              value={selectedCompetitionId}
              onChange={(e) => {
                setSelectedCompetitionId(e.target.value);
                setSelectedMatchId("");
                setResultStandings(null);
                setAiInsight(null);
              }}
              className="bg-surface-2 border border-edge/12 rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-brand transition-colors"
            >
              <option value="">All Competitions</option>
              {competitions.map((comp: any) => (
                <option key={comp.id} value={comp.id}>
                  {comp.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Match selector */}
      <div className="bg-surface border border-edge/12 rounded-2xl p-5 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-2xl pointer-events-none"></div>

        <h2 className="text-base font-extrabold text-foreground">
          {activeTab === "my-team"
            ? "Select Your Team's Upcoming Match"
            : t("simulator.selectMatch")}
        </h2>

        {activeTab === "my-team" && !favoriteTeamId ? (
          <div className="p-4 bg-surface-2 rounded-xl text-center space-y-2">
            <p className="text-xs text-muted">
              You haven't selected a favorite team yet.
            </p>
          </div>
        ) : (
          <select
            value={selectedMatchId}
            onChange={(e) => {
              setSelectedMatchId(e.target.value);
              setResultStandings(null);
              setAiInsight(null);
            }}
            className="w-full bg-surface-2 border border-edge/12 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-brand transition-colors"
          >
            <option value="">{t("simulator.selectMatch")}…</option>
            {activeMatchesList?.map((m) => {
              const home = teamsMap.get(m.homeTeamId);
              const away = teamsMap.get(m.awayTeamId);
              return (
                <option key={m.id} value={m.id}>
                  {home?.name || home?.shortName || "?"} vs{" "}
                  {away?.name || away?.shortName || "?"} —{" "}
                  {formatMatchDay(m.kickoffAt)} {formatKickoff(m.kickoffAt)}
                </option>
              );
            })}
          </select>
        )}

        {/* Selected match preview */}
        {selectedMatch && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 bg-surface-2 rounded-xl p-4">
              {/* Home */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                {homeTeam?.crestUrl && (
                  <img
                    src={homeTeam.crestUrl}
                    alt={homeTeam.name}
                    className="w-10 h-10 object-contain"
                  />
                )}
                <span className="text-sm font-semibold text-foreground">
                  {homeTeam?.shortName ?? "?"}
                </span>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={homeScore}
                  onChange={(e) => setHomeScore(Number(e.target.value))}
                  className="w-16 text-center text-xl font-black bg-surface border border-edge/12 rounded-lg py-1 text-foreground focus:outline-none focus:border-brand transition-colors"
                />
              </div>

              <span className="text-muted font-bold text-lg">–</span>

              {/* Away */}
              <div className="flex flex-col items-center gap-1.5 flex-1">
                {awayTeam?.crestUrl && (
                  <img
                    src={awayTeam.crestUrl}
                    alt={awayTeam.name}
                    className="w-10 h-10 object-contain"
                  />
                )}
                <span className="text-sm font-semibold text-foreground">
                  {awayTeam?.shortName ?? "?"}
                </span>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={awayScore}
                  onChange={(e) => setAwayScore(Number(e.target.value))}
                  className="w-16 text-center text-xl font-black bg-surface border border-edge/12 rounded-lg py-1 text-foreground focus:outline-none focus:border-brand transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        <Button
          disabled={!selectedMatchId}
          loading={simulate.isPending}
          onClick={() =>
            simulate.mutate({ matchId: selectedMatchId, homeScore, awayScore })
          }
          className="w-full"
        >
          {simulate.isPending ? (
            <Activity className="w-4 h-4 animate-spin" />
          ) : (
            <Swords className="w-4 h-4" />
          )}
          {simulate.isPending
            ? t("simulator.loading")
            : t("simulator.simulate")}
        </Button>
      </div>

      {/* Projected standings */}
      {resultStandings && resultStandings.length > 0 && (
        <div className="bg-surface border border-edge/12 rounded-2xl p-5">
          <h2 className="text-base font-extrabold text-foreground mb-4">
            {t("simulator.projectedStandings")}
          </h2>
          <StandingsTable rows={resultStandings} />
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-muted" />
          {t("simulator.history")}
        </h2>

        {loadingSims ? (
          <PageSpinner />
        ) : !simulations?.length ? (
          <p className="text-muted text-sm">{t("simulator.noSimulations")}</p>
        ) : (
          <div className="space-y-3">
            {simulations.map((sim: any) => {
              // Now we find the match using 'allMatches' instead of just 'scheduledMatches'
              const m = allMatches?.find((x: any) => x.id === sim.matchId);
              const home = m ? teamsMap.get(m.homeTeamId) : undefined;
              const away = m ? teamsMap.get(m.awayTeamId) : undefined;

              return (
                <div
                  key={sim.id}
                  className="bg-surface border border-edge/12 rounded-xl p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-brand/30 transition-colors"
                  onClick={() => {
                    const rows = normalizeStandings(
                      sim.resultingStandings,
                      teamsMap,
                    );
                    if (rows) setResultStandings(rows);
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {home?.shortName || home?.name || "?"} vs{" "}
                      {away?.shortName || away?.name || "?"}
                    </span>
                  </div>
                  <div className="text-xl font-black text-foreground flex-shrink-0">
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
