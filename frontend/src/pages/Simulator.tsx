import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Swords, History, Lock, Sparkles, Activity } from "lucide-react";
import { listMatches } from "../api/matches";
import { createSimulation, listSimulations } from "../api/simulations";
import { useTeamsMap } from "../hooks/useTeamsMap";
import { useAppStore } from "../store/app";
import StandingsTable from "../components/StandingsTable";
import Button from "../components/ui/Button";
import { PageSpinner } from "../components/ui/Spinner";
import { formatMatchDay, formatKickoff } from "../lib/utils";
import type { StandingRow } from "../types";

export default function Simulator() {
  const { t } = useTranslation();
  const teamsMap = useTeamsMap();
  const token = useAppStore((s) => s.token);
  const qc = useQueryClient();

  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [resultStandings, setResultStandings] = useState<StandingRow[] | null>(
    null,
  );
  const [aiInsight, setAiInsight] = useState<any>(null);

  // Só busca as partidas se o usuário estiver logado
  const { data: scheduledMatches } = useQuery({
    queryKey: ["matches", { status: "scheduled", limit: 30 }],
    queryFn: () => listMatches({ status: "scheduled", limit: 30 }),
    enabled: !!token,
  });

  const { data: simulations, isLoading: loadingSims } = useQuery({
    queryKey: ["simulations"],
    queryFn: listSimulations,
    enabled: !!token,
  });

  const simulate = useMutation({
    mutationFn: createSimulation,
    onSuccess: (result) => {
      const data = result.data || result;
      setResultStandings((data.resultingStandings as StandingRow[]) ?? null);
      setAiInsight(data);
      qc.invalidateQueries({ queryKey: ["simulations"] });
    },
  });

  const selectedMatch = scheduledMatches?.find((m) => m.id === selectedMatchId);
  const homeTeam = selectedMatch
    ? teamsMap.get(selectedMatch.homeTeamId)
    : undefined;
  const awayTeam = selectedMatch
    ? teamsMap.get(selectedMatch.awayTeamId)
    : undefined;

  // Tela de bloqueio caso o usuário não esteja logado
  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
        <Lock className="w-12 h-12 text-muted opacity-40" />
        <h2 className="text-xl font-extrabold text-foreground">
          {t("simulator.title")}
        </h2>
        <p className="text-muted max-w-sm">{t("simulator.signInRequired")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
          <Swords className="w-6 h-6 text-brand" />
          {t("simulator.title")}
        </h1>
        <p className="text-muted mt-1 text-sm">{t("simulator.description")}</p>
      </div>

      {/* Match selector */}
      <div className="bg-surface border border-edge/12 rounded-2xl p-5 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-2xl pointer-events-none"></div>

        <h2 className="text-base font-extrabold text-foreground">
          {t("simulator.selectMatch")}
        </h2>

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
          {scheduledMatches?.map((m) => {
            const home = teamsMap.get(m.homeTeamId);
            const away = teamsMap.get(m.awayTeamId);
            return (
              <option key={m.id} value={m.id}>
                {home?.shortName ?? "?"} vs {away?.shortName ?? "?"} —{" "}
                {formatMatchDay(m.kickoffAt)} {formatKickoff(m.kickoffAt)}
              </option>
            );
          })}
        </select>

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
                  max={20}
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
                  max={20}
                  value={awayScore}
                  onChange={(e) => setAwayScore(Number(e.target.value))}
                  className="w-16 text-center text-xl font-black bg-surface border border-edge/12 rounded-lg py-1 text-foreground focus:outline-none focus:border-brand transition-colors"
                />
              </div>
            </div>

            {/* AI Tactical Engine Card / Insights */}
            {aiInsight && (
              <div className="bg-surface-2 border border-brand/20 rounded-xl p-4 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-edge/10 pb-2">
                  <span className="font-black text-brand uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    AI Tactical Engine v2.6
                  </span>
                  <span className="text-[10px] bg-brand/10 text-brand px-2 py-0.5 uppercase border border-brand/20 rounded">
                    Analyzed
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-muted">Simulated Match ID:</span>
                  <span className="text-foreground">
                    {aiInsight.matchId || selectedMatchId}
                  </span>
                </div>
              </div>
            )}
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

        {simulate.isError && (
          <p className="text-sm text-red-400 text-center">
            {t("errors.generic")}
          </p>
        )}
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
              const m = scheduledMatches?.find((x) => x.id === sim.matchId);
              const home = m ? teamsMap.get(m.homeTeamId) : undefined;
              const away = m ? teamsMap.get(m.awayTeamId) : undefined;
              return (
                <div
                  key={sim.id}
                  className="bg-surface border border-edge/12 rounded-xl p-4 flex items-center justify-between gap-4 cursor-pointer hover:border-brand/30 transition-colors"
                  onClick={() => {
                    if (sim.resultingStandings) {
                      setResultStandings(
                        sim.resultingStandings as StandingRow[],
                      );
                    }
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {home?.shortName ?? "?"} vs {away?.shortName ?? "?"}
                    </span>
                  </div>
                  <div className="text-xl font-black text-foreground flex-shrink-0">
                    {sim.simulatedHomeScore} – {sim.simulatedAwayScore}
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
