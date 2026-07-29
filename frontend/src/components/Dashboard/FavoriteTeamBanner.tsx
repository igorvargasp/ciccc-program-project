import React, { useState, useEffect } from "react";
import FootballPitch from "../Lineup/FootballPitch";

export interface Team {
  id: string | number;
  name: string;
  badgeUrl?: string;
  country?: string;
  league?: string;
  stats?: {
    winRate: string;
    goalsScored: number;
    cleanSheets: number;
  };
}

interface DashboardProps {
  onOpenTeamModal?: () => void;
}

// ==========================================
// COMPONENTE: PRÓXIMAS PARTIDAS
// ==========================================
function UpcomingMatches({ teamId }: { teamId?: string | number }) {
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;

    const fetchMatches = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const baseUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
        const res = await fetch(`${baseUrl}/api/teams/${teamId}/matches`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || "Erro ao buscar próximas partidas.");
        }

        // Garante que pegamos um array a partir de diferentes formatos de resposta de API
        const matchesData = json.data || json.matches || json || [];
        setMatches(Array.isArray(matchesData) ? matchesData : []);
      } catch (err: any) {
        console.error("Erro ao carregar partidas:", err);
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
        Selecione um clube para ver as próximas partidas.
      </div>
    );
  }

  return (
    <div className="bg-[#14171c] border border-[#414755]/30 p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[#414755]/30 pb-3">
        <h3 className="text-xs font-black text-[#00d2fd] uppercase tracking-[0.2em] flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">event</span>
          Próximas Partidas
        </h3>
        <span className="text-[10px] text-[#8b90a0] uppercase">
          Telemetry Schedule
        </span>
      </div>

      {isLoading ? (
        <div className="py-6 text-center text-xs text-[#00d2fd] animate-pulse">
          Sincronizando calendário de partidas...
        </div>
      ) : error ? (
        <div className="text-xs text-red-400 p-3 bg-red-500/10 border border-red-500/20">
          {error}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-xs text-[#8b90a0] text-center py-4 uppercase">
          Nenhuma partida agendada encontrada.
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match, idx) => (
            <div
              key={match.id || idx}
              className="bg-[#0d0f12] border border-[#414755]/20 p-3 flex items-center justify-between hover:border-[#00d2fd]/50 transition-all"
            >
              <div className="flex items-center gap-3 w-2/5 justify-end">
                <span className="text-xs font-bold uppercase truncate text-right">
                  {match.homeTeam || match.home_team || "Mandante"}
                </span>
                {(match.homeBadge || match.home_badge) && (
                  <img
                    src={match.homeBadge || match.home_badge}
                    alt=""
                    className="w-6 h-6 object-contain"
                  />
                )}
              </div>
              <div className="px-2 py-1 bg-[#14171c] border border-[#414755]/30 text-[10px] font-mono text-[#00d2fd]">
                {match.date
                  ? new Date(match.date).toLocaleDateString()
                  : match.time || "Em breve"}
              </div>
              <div className="flex items-center gap-3 w-2/5">
                {(match.awayBadge || match.away_badge) && (
                  <img
                    src={match.awayBadge || match.away_badge}
                    alt=""
                    className="w-6 h-6 object-contain"
                  />
                )}
                <span className="text-xs font-bold uppercase truncate">
                  {match.awayTeam || match.away_team || "Visitante"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// COMPONENTE: TABELA DE CLASSIFICAÇÃO
// ==========================================
function StandingsTable({ teamId }: { teamId?: string | number }) {
  const [standings, setStandings] = useState<any[]>([]);
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
          throw new Error(
            json.error || "Erro ao buscar tabela de classificação.",
          );
        }

        const standingsData =
          json.data || json.standings || json.table || json || [];
        setStandings(Array.isArray(standingsData) ? standingsData : []);
      } catch (err: any) {
        console.error("Erro ao carregar standings:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStandings();
  }, [teamId]);

  if (!teamId) return null;

  return (
    <div className="bg-[#14171c] border border-[#414755]/30 p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[#414755]/30 pb-3">
        <h3 className="text-xs font-black text-[#4b8eff] uppercase tracking-[0.2em] flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">leaderboard</span>
          Tabela de Classificação
        </h3>
        <span className="text-[10px] text-[#8b90a0] uppercase">
          League Standings
        </span>
      </div>

      {isLoading ? (
        <div className="py-6 text-center text-xs text-[#4b8eff] animate-pulse">
          Calculando matriz da liga...
        </div>
      ) : error ? (
        <div className="text-xs text-red-400 p-3 bg-red-500/10 border border-red-500/20">
          {error}
        </div>
      ) : standings.length === 0 ? (
        <div className="text-xs text-[#8b90a0] text-center py-4 uppercase">
          Nenhum dado de classificação disponível para este clube.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#414755]/30 text-[#8b90a0] uppercase text-[10px]">
                <th className="py-2 px-2">#</th>
                <th className="py-2 px-2">Clube</th>
                <th className="py-2 px-2 text-center">J</th>
                <th className="py-2 px-2 text-center">SG</th>
                <th className="py-2 px-2 text-right">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#414755]/10 font-mono">
              {standings.map((row, idx) => (
                <tr
                  key={row.rank || row.position || idx}
                  className="hover:bg-[#0d0f12]/60 transition-colors"
                >
                  <td className="py-2.5 px-2 font-bold text-[#00d2fd]">
                    {row.rank || row.position || idx + 1}
                  </td>
                  <td className="py-2.5 px-2 flex items-center gap-2 font-sans uppercase font-bold">
                    {(row.teamLogo || row.logo || row.badge) && (
                      <img
                        src={row.teamLogo || row.logo || row.badge}
                        alt=""
                        className="w-4 h-4 object-contain"
                      />
                    )}
                    <span className="truncate max-w-[120px] sm:max-w-xs">
                      {row.teamName || row.name || row.club}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center text-[#8b90a0]">
                    {row.played ?? row.matchesPlayed ?? 0}
                  </td>
                  <td className="py-2.5 px-2 text-center text-[#8b90a0]">
                    {row.goalDiff ?? row.goalDifference ?? 0}
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold text-[#e2e2e8]">
                    {row.points ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ==========================================
// COMPONENTE: SIMULADOR AO VIVO
// ==========================================
function LiveSimulator({
  teamId,
  teamName,
}: {
  teamId?: string | number;
  teamName?: string;
}) {
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async () => {
    if (!teamId) return;

    setIsSimulating(true);
    setError(null);
    try {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
      const res = await fetch(`${baseUrl}/api/simulations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Erro ao executar simulação ao vivo.");
      }

      setSimulationResult(json.data || json);
    } catch (err: any) {
      console.error("Erro no simulador:", err);
      setError(err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="bg-[#14171c] border border-[#414755]/30 p-6 space-y-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d2fd]/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex items-center justify-between border-b border-[#414755]/30 pb-3">
        <h3 className="text-xs font-black text-[#00d2fd] uppercase tracking-[0.2em] flex items-center gap-2">
          <span className="material-symbols-outlined text-sm animate-pulse">
            analytics
          </span>
          Simulador Ao Vivo
        </h3>
        <span className="text-[10px] font-mono bg-[#00d2fd]/10 text-[#00d2fd] px-2 py-0.5 uppercase border border-[#00d2fd]/20">
          Engine v2.6
        </span>
      </div>

      <p className="text-xs text-[#8b90a0] leading-relaxed">
        Simule cenários táticos e probabilidade de vitória baseados nas
        estatísticas atuais enviadas pelo seu servidor local para{" "}
        <span className="text-[#e2e2e8] font-bold uppercase">
          {teamName || "o clube selecionado"}
        </span>
        .
      </p>

      {error && (
        <div className="text-xs text-red-400 p-3 bg-red-500/10 border border-red-500/20">
          {error}
        </div>
      )}

      {simulationResult && (
        <div className="bg-[#0d0f12] border border-[#00d2fd]/30 p-4 space-y-3 font-mono">
          <div className="text-[10px] font-black text-[#00d2fd] uppercase tracking-wider">
            Resultado da Simulação
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#8b90a0]">Probabilidade de Vitória:</span>
            <span className="font-bold text-emerald-400">
              {simulationResult.winProbability ||
                simulationResult.win_rate ||
                "68%"}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#8b90a0]">Placar Estimado:</span>
            <span className="font-bold text-[#e2e2e8]">
              {simulationResult.predictedScore ||
                simulationResult.score ||
                "2 - 1"}
            </span>
          </div>
        </div>
      )}

      <button
        onClick={runSimulation}
        disabled={!teamId || isSimulating}
        className="w-full py-3 bg-[#00d2fd] hover:bg-[#00d2fd]/80 disabled:opacity-50 disabled:cursor-not-allowed text-[#001a41] text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#00d2fd]/10"
      >
        {isSimulating ? (
          <>
            <span className="material-symbols-outlined text-sm animate-spin">
              refresh
            </span>
            Processando Algoritmo...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-sm">
              play_arrow
            </span>
            Executar Simulação Tática
          </>
        )}
      </button>
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL: DASHBOARD
// ==========================================
export function Dashboard({ onOpenTeamModal }: DashboardProps) {
  const [favoriteTeam, setFavoriteTeam] = useState<Team | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "feed" | "selector" | "lineup" | "standings"
  >("feed");
  const [apiError, setApiError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [formation, setFormation] = useState("4-3-3");
  const [lineupPlayers, setLineupPlayers] = useState<Record<number, any>>({});

  const loadSavedTeam = () => {
    const savedTeamRaw = localStorage.getItem("favorite_team");
    if (!savedTeamRaw) {
      setFavoriteTeam(null);
      return;
    }

    try {
      const savedTeam: Team = JSON.parse(savedTeamRaw);
      setFavoriteTeam(savedTeam);
      fetchTeamDataFromBackend(savedTeam);
    } catch (err) {
      console.error("Erro ao ler time favorito do localStorage:", err);
    }
  };

  useEffect(() => {
    loadSavedTeam();

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "favorite_team") {
        loadSavedTeam();
      }
    };

    const handleCustomTeamChange = () => {
      loadSavedTeam();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("favoriteTeamChanged", handleCustomTeamChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("favoriteTeamChanged", handleCustomTeamChange);
    };
  }, []);

  const fetchTeamDataFromBackend = async (team: Team) => {
    if (!team?.id) return;

    setIsLoadingStats(true);
    setApiError(null);

    try {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
      const res = await fetch(`${baseUrl}/api/teams/${team.id}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error || "Erro ao carregar dados do time no servidor.",
        );
      }

      const teamData = json.data || json;

      const updatedTeam: Team = {
        ...team,
        name: teamData.name || team.name,
        badgeUrl:
          teamData.badgeUrl || teamData.logo || teamData.badge || team.badgeUrl,
        country: teamData.country || team.country,
        league: teamData.league || team.league,
        stats: teamData.stats || {
          winRate: teamData.winRate || teamData.win_rate || "---",
          goalsScored: teamData.goalsScored ?? teamData.goals_scored ?? 0,
          cleanSheets: teamData.cleanSheets ?? teamData.clean_sheets ?? 0,
        },
      };

      setFavoriteTeam(updatedTeam);
      localStorage.setItem("favorite_team", JSON.stringify(updatedTeam));
    } catch (err: any) {
      console.error("Erro ao sincronizar com o backend:", err);
      setApiError(err.message);
      // Mantém o time atual mesmo se o backend falhar para não sumir com o estado visual
      setFavoriteTeam(team);
    } finally {
      setIsLoadingStats(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f12] font-['Archivo_Narrow'] text-[#e2e2e8] p-4 md:p-8 relative selection:bg-[#00d2fd]/30 selection:text-[#00d2fd]">
      <div
        className="absolute inset-0 z-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#00d2fd 1px, transparent 1px), linear-gradient(90deg, #00d2fd 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      ></div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        {/* DASHBOARD HEADER */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#414755]/20 pb-6 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00d2fd] text-2xl animate-pulse">
                terminal
              </span>
              <span className="text-xs font-black text-[#00d2fd] uppercase tracking-[0.25em]">
                Central Telemetry Console
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight">
              OPERATOR{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d2fd] to-[#4b8eff]">
                DASHBOARD
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center bg-[#14171c] border border-[#414755]/30 p-1">
              <button
                onClick={() => setActiveTab("feed")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "feed"
                    ? "bg-[#4b8eff] text-[#001a41]"
                    : "text-[#8b90a0] hover:text-[#e2e2e8]"
                }`}
              >
                Tactical Feed
              </button>
              <button
                onClick={() => setActiveTab("standings")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "standings"
                    ? "bg-[#4b8eff] text-[#001a41]"
                    : "text-[#8b90a0] hover:text-[#e2e2e8]"
                }`}
              >
                Standings
              </button>
              <button
                onClick={() => setActiveTab("selector")}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "selector"
                    ? "bg-[#4b8eff] text-[#001a41]"
                    : "text-[#8b90a0] hover:text-[#e2e2e8]"
                }`}
              >
                Active Club ({favoriteTeam ? 1 : 0})
              </button>
            </div>

            {onOpenTeamModal && (
              <button
                onClick={onOpenTeamModal}
                className="px-3 py-2.5 text-xs bg-[#00d2fd]/10 hover:bg-[#00d2fd]/20 text-[#00d2fd] border border-[#00d2fd]/30 font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                aria-label="Change Team"
              >
                <span className="material-symbols-outlined text-sm">
                  swap_horiz
                </span>
                <span className="hidden sm:inline">Change Team</span>
              </button>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="bg-[#14171c] border border-[#414755]/30 p-2.5 text-[#00d2fd] hover:border-[#00d2fd] transition-all cursor-pointer flex items-center justify-center"
              aria-label="Toggle Menu"
            >
              <span className="material-symbols-outlined text-xl">
                {isMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </header>

        {/* SIDEBAR BURGER MENU */}
        <div
          className={`fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
            isMenuOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className={`w-80 bg-[#14171c] border-l border-[#00d2fd]/30 p-6 flex flex-col justify-between shadow-2xl transform transition-transform duration-300 ease-out ${
              isMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#414755]/30 pb-4">
                <span className="text-xs font-black text-[#00d2fd] uppercase tracking-[0.2em]">
                  Navigation Matrix
                </span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="text-[#8b90a0] hover:text-[#e2e2e8] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">
                    close
                  </span>
                </button>
              </div>

              <nav className="flex flex-col space-y-2">
                <button
                  onClick={() => {
                    setActiveTab("feed");
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-[#0d0f12] border border-[#414755]/20 hover:border-[#00d2fd] text-[#e2e2e8] hover:text-[#00d2fd] text-xs font-bold uppercase tracking-widest transition-all group cursor-pointer text-left"
                >
                  <span>Matches / Feed</span>
                  <span className="material-symbols-outlined text-sm text-[#8b90a0] group-hover:text-[#00d2fd]">
                    sports_soccer
                  </span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("standings");
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-[#0d0f12] border border-[#414755]/20 hover:border-[#00d2fd] text-[#e2e2e8] hover:text-[#00d2fd] text-xs font-bold uppercase tracking-widest transition-all group cursor-pointer text-left"
                >
                  <span>Standings Table</span>
                  <span className="material-symbols-outlined text-sm text-[#8b90a0] group-hover:text-[#00d2fd]">
                    leaderboard
                  </span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("lineup");
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 bg-[#0d0f12] border border-[#414755]/25 hover:border-[#00d2fd] text-[#e2e2e8] hover:text-[#00d2fd] text-xs font-bold uppercase tracking-widest transition-all group cursor-pointer text-left"
                >
                  <span>Lineup Pitch</span>
                  <span className="material-symbols-outlined text-sm text-[#8b90a0] group-hover:text-[#00d2fd]">
                    group
                  </span>
                </button>
              </nav>
            </div>

            <div className="border-t border-[#414755]/30 pt-4 text-[10px] text-[#8b90a0] uppercase tracking-wider text-center">
              Operator System v2.6
            </div>
          </div>
        </div>

        {apiError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 text-xs font-mono">
            [API ERROR WARNING]: {apiError} (Verifique se o backend está rodando
            em `http://localhost:4000`)
          </div>
        )}

        {/* ABA: LINEUP */}
        {activeTab === "lineup" && (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-full flex justify-between items-center max-w-4xl">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#00d2fd]">
                Team Lineup Matrix
              </h2>
              <button
                onClick={() => setActiveTab("feed")}
                className="px-4 py-2 bg-[#14171c] border border-[#414755]/30 text-xs font-bold uppercase tracking-wider hover:border-[#00d2fd] transition-all cursor-pointer"
              >
                Voltar ao Feed
              </button>
            </div>
            <FootballPitch
              formation={formation}
              lineupPlayers={lineupPlayers}
              onSelectSlot={(index) => {
                console.log("Slot selecionado:", index);
              }}
            />
          </div>
        )}

        {/* ABA: STANDINGS EXCLUSIVA */}
        {activeTab === "standings" && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#4b8eff]">
                Global Standings Panel
              </h2>
              <button
                onClick={() => setActiveTab("feed")}
                className="px-4 py-2 bg-[#14171c] border border-[#414755]/30 text-xs font-bold uppercase tracking-wider hover:border-[#00d2fd] transition-all cursor-pointer"
              >
                Voltar ao Feed
              </button>
            </div>
            <StandingsTable teamId={favoriteTeam?.id} />
          </div>
        )}

        {/* ABA 1: TACTICAL FEED MONITOR */}
        {activeTab === "feed" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#8b90a0] flex items-center gap-2">
                <span className="w-2 h-2 bg-[#00d2fd] rounded-full"></span>
                Active Team Monitoring
              </h2>

              {!favoriteTeam ? (
                <div className="bg-[#14171c] border border-dashed border-[#414755]/40 p-12 text-center space-y-4">
                  <span className="material-symbols-outlined text-[#414755] text-5xl">
                    monitoring
                  </span>
                  <p className="text-sm text-[#8b90a0] max-w-xs mx-auto">
                    No main club selected in system memory. Select your main
                    club to start receiving live telemetry feeds.
                  </p>
                  {onOpenTeamModal && (
                    <button
                      onClick={onOpenTeamModal}
                      className="px-4 py-2 bg-[#00d2fd] text-[#001a41] text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      Selecionar Clube
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-[#14171c] border border-[#00d2fd]/40 p-6 relative group transition-all duration-300 hover:border-[#00d2fd] shadow-xl shadow-[#00d2fd]/5">
                    <div className="absolute top-0 left-0 w-[2px] h-full bg-[#00d2fd]"></div>

                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[#0d0f12] border border-[#00d2fd]/30 p-2 flex items-center justify-center">
                          {favoriteTeam.badgeUrl ? (
                            <img
                              src={favoriteTeam.badgeUrl}
                              alt={favoriteTeam.name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-[#00d2fd] text-2xl">
                              sports_soccer
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-black text-xl tracking-wide uppercase text-[#e2e2e8]">
                            {favoriteTeam.name}
                          </h3>
                          <span className="text-xs text-[#00d2fd] uppercase tracking-wider font-bold">
                            {favoriteTeam.league ||
                              favoriteTeam.country ||
                              "MAIN CLUB"}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-black bg-[#00d2fd]/10 border border-[#00d2fd]/30 px-2 py-1 text-[#00d2fd] uppercase tracking-widest">
                        CONNECTED
                      </span>
                    </div>

                    {isLoadingStats ? (
                      <div className="py-8 text-center text-xs text-[#00d2fd] animate-pulse">
                        Syncing club telemetry data from backend server...
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3 border-t border-[#414755]/30 pt-5 text-center">
                        <div className="bg-[#0d0f12]/80 p-3 border border-[#414755]/20">
                          <span className="block text-[10px] font-bold text-[#8b90a0] uppercase tracking-wider mb-1">
                            Win Rate
                          </span>
                          <span className="text-xl font-black text-[#00d2fd]">
                            {favoriteTeam.stats?.winRate || "0%"}
                          </span>
                        </div>
                        <div className="bg-[#0d0f12]/80 p-3 border border-[#414755]/20">
                          <span className="block text-[10px] font-bold text-[#8b90a0] uppercase tracking-wider mb-1">
                            Goals Scored
                          </span>
                          <span className="text-xl font-black text-[#4b8eff]">
                            {favoriteTeam.stats?.goalsScored ?? 0}
                          </span>
                        </div>
                        <div className="bg-[#0d0f12]/80 p-3 border border-[#414755]/20">
                          <span className="block text-[10px] font-bold text-[#8b90a0] uppercase tracking-wider mb-1">
                            Clean Sheets
                          </span>
                          <span className="text-xl font-black text-[#e2e2e8]">
                            {favoriteTeam.stats?.cleanSheets ?? 0}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <UpcomingMatches teamId={favoriteTeam?.id} />
              <StandingsTable teamId={favoriteTeam?.id} />
            </div>

            <div className="space-y-6">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#8b90a0] flex items-center gap-2">
                <span className="w-2 h-2 bg-[#4b8eff] rounded-full"></span>
                System Operations
              </h2>

              <LiveSimulator
                teamId={favoriteTeam?.id}
                teamName={favoriteTeam?.name}
              />
            </div>
          </div>
        )}

        {/* TAB 2: ACTIVE CLUB CONTROL */}
        {activeTab === "selector" && (
          <div className="bg-[#14171c] border border-[#414755]/30 p-6 space-y-4">
            <h2 className="text-lg font-bold uppercase tracking-tight">
              Selected Club Configuration
            </h2>
            {favoriteTeam ? (
              <div className="flex items-center gap-4 bg-[#0d0f12] p-4 border border-[#00d2fd]/30">
                {favoriteTeam.badgeUrl && (
                  <img
                    src={favoriteTeam.badgeUrl}
                    alt={favoriteTeam.name}
                    className="w-12 h-12 object-contain"
                  />
                )}
                <div>
                  <p className="font-bold text-sm text-[#e2e2e8] uppercase">
                    {favoriteTeam.name}
                  </p>
                  <p className="text-xs text-[#8b90a0]">
                    ID: {favoriteTeam.id} | League/Country:{" "}
                    {favoriteTeam.league || favoriteTeam.country || "N/A"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#8b90a0]">No active club assigned.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
