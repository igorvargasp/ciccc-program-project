import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

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

export function Dashboard({ onOpenTeamModal }: DashboardProps) {
  const [favoriteTeam, setFavoriteTeam] = useState<Team | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [activeTab, setActiveTab] = useState<"feed" | "selector">("feed");
  const [apiError, setApiError] = useState<string | null>(null);

  // Estados para dados extras (Próximos Jogos e Classificação)
  const [standings, setStandings] = useState<any[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [isLoadingExtra, setIsLoadingExtra] = useState(false);

  // Função para carregar o time salvo e iniciar as requisições
  const loadSavedTeam = () => {
    const savedTeamRaw = localStorage.getItem("favorite_team");
    if (!savedTeamRaw) {
      setFavoriteTeam(null);
      setStandings([]);
      setUpcomingMatches([]);
      return;
    }

    try {
      const savedTeam: Team = JSON.parse(savedTeamRaw);
      setFavoriteTeam(savedTeam);
      fetchRealTeamData(savedTeam);
    } catch (err) {
      console.error("Erro ao ler time favorito do localStorage:", err);
    }
  };

  // Efeito para carregar ao montar e escutar mudanças em tempo real
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

  // Função para buscar dados extras (Classificação e Próximos Jogos) com temporada dinâmica
  const fetchTeamExtraData = async (
    teamId: string | number,
    leagueId: number,
    season: number,
  ) => {
    setIsLoadingExtra(true);
    try {
      const apiKey = import.meta.env.VITE_FOOTBALL_API_KEY;
      if (!apiKey) return;

      // A. Buscar Classificação (Standings) da Liga
      const standingsRes = await fetch(
        `https://v3.football.api-sports.io/standings?league=${leagueId}&season=${season}`,
        {
          method: "GET",
          headers: { "x-apisports-key": apiKey },
        },
      );
      const standingsData = await standingsRes.json();

      if (standingsData.response && standingsData.response.length > 0) {
        const leagueTable = standingsData.response[0].league.standings[0];
        setStandings(leagueTable);
      }

      // B. Buscar Próximos Jogos do Time (Next Fixtures)
      const fixturesRes = await fetch(
        `https://v3.football.api-sports.io/fixtures?team=${teamId}&season=${season}&next=3`,
        {
          method: "GET",
          headers: { "x-apisports-key": apiKey },
        },
      );
      const fixturesData = await fixturesRes.json();

      if (fixturesData.response) {
        setUpcomingMatches(fixturesData.response);
      }
    } catch (err) {
      console.error("Erro ao buscar dados extras da API:", err);
    } finally {
      setIsLoadingExtra(false);
    }
  };

  const fetchRealTeamData = async (team: Team) => {
    setIsLoadingStats(true);
    setApiError(null);

    try {
      const apiKey = import.meta.env.VITE_FOOTBALL_API_KEY;
      if (!apiKey) {
        setApiError("Chave da API não configurada.");
        setIsLoadingStats(false);
        return;
      }

      let validTeamId = team.id;

      // Se o ID for um UUID ou não for numérico, busca o ID correto pelo nome
      const isUuid = typeof team.id === "string" && team.id.includes("-");
      if (isUuid || !Number(team.id)) {
        const cleanedName = team.name
          .replace(/\b(FC|CF|SAD|EC|CA|AS)\b/gi, "")
          .trim();

        let searchRes = await fetch(
          `https://v3.football.api-sports.io/teams?search=${encodeURIComponent(cleanedName)}`,
          {
            method: "GET",
            headers: { "x-apisports-key": apiKey },
          },
        );
        let searchData = await searchRes.json();

        if (!searchData.response || searchData.response.length === 0) {
          searchRes = await fetch(
            `https://v3.football.api-sports.io/teams?search=${encodeURIComponent(team.name)}`,
            {
              method: "GET",
              headers: { "x-apisports-key": apiKey },
            },
          );
          searchData = await searchRes.json();
        }

        if (searchData.response && searchData.response.length > 0) {
          validTeamId = searchData.response[0].team.id;
        } else {
          setApiError(
            `Não foi possível encontrar o time "${team.name}" na base numérica da API-Sports.`,
          );
          setIsLoadingStats(false);
          return;
        }
      }

      const currentYear = new Date().getFullYear();
      let leagueId = null;
      let leagueName = team.league || team.country || "National League";

      let leaguesRes = await fetch(
        `https://v3.football.api-sports.io/leagues?team=${validTeamId}&season=${currentYear}`,
        {
          method: "GET",
          headers: { "x-apisports-key": apiKey },
        },
      );
      let leaguesData = await leaguesRes.json();

      if (!leaguesData.response || leaguesData.response.length === 0) {
        leaguesRes = await fetch(
          `https://v3.football.api-sports.io/leagues?team=${validTeamId}&season=${currentYear - 1}`,
          {
            method: "GET",
            headers: { "x-apisports-key": apiKey },
          },
        );
        leaguesData = await leaguesRes.json();
      }

      if (leaguesData.response && leaguesData.response.length > 0) {
        const leagueInfo = leaguesData.response[0];
        leagueId = leagueInfo.league.id;
        leagueName = `${leagueInfo.league.name} (${leagueInfo.country.name})`;
      }

      if (!leagueId) {
        setApiError(
          `A API-Sports não encontrou nenhuma liga ativa para o time ID numérico: ${validTeamId}.`,
        );
        setIsLoadingStats(false);
        return;
      }

      const targetSeason = leaguesData.response[0].seasons?.some(
        (s: any) => s.year === currentYear && s.current,
      )
        ? currentYear
        : currentYear - 1;

      const statsRes = await fetch(
        `https://v3.football.api-sports.io/teams/statistics?team=${validTeamId}&league=${leagueId}&season=${targetSeason}`,
        {
          method: "GET",
          headers: { "x-apisports-key": apiKey },
        },
      );
      const statsDataJson = await statsRes.json();

      if (
        statsDataJson.errors &&
        Object.keys(statsDataJson.errors).length > 0
      ) {
        setApiError("Limite da API atingido ou erro ao buscar estatísticas.");
        setIsLoadingStats(false);
        return;
      }

      if (statsDataJson.response) {
        const stats = statsDataJson.response;
        const totalMatches = stats.fixtures?.played?.total || 0;
        const wins = stats.fixtures?.wins?.total || 0;
        const winRateCalc =
          totalMatches > 0
            ? Math.round((wins / totalMatches) * 100) + "%"
            : "0%";

        const updatedTeam: Team = {
          ...team,
          id: validTeamId,
          league: leagueName,
          stats: {
            winRate: winRateCalc,
            goalsScored: stats.goals?.for?.total?.total || 0,
            cleanSheets: stats.clean_sheet?.total || 0,
          },
        };

        setFavoriteTeam(updatedTeam);
        localStorage.setItem("favorite_team", JSON.stringify(updatedTeam));

        fetchTeamExtraData(validTeamId, leagueId, targetSeason);
      } else {
        setApiError(
          "Nenhum dado estatístico retornado pela API para este time.",
        );
      }
    } catch (err) {
      console.error("Erro na requisição das estatísticas:", err);
      setApiError("Erro de conexão ao buscar dados da API.");
    } finally {
      setIsLoadingStats(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0f12] font-['Archivo_Narrow'] text-[#e2e2e8] p-4 md:p-8 relative selection:bg-[#00d2fd]/30 selection:text-[#00d2fd]">
      {/* Background Grid Pattern Overlay */}
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

          {/* Navigation Controls & Change Team Button */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#14171c] border border-[#414755]/30 p-1">
              <button
                onClick={() => setActiveTab("feed")}
                className={`px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "feed"
                    ? "bg-[#4b8eff] text-[#001a41]"
                    : "text-[#8b90a0] hover:text-[#e2e2e8]"
                }`}
              >
                Tactical Feed
              </button>
              <button
                onClick={() => setActiveTab("selector")}
                className={`px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "selector"
                    ? "bg-[#4b8eff] text-[#001a41]"
                    : "text-[#8b90a0] hover:text-[#e2e2e8]"
                }`}
              >
                Active Club ({favoriteTeam ? 1 : 0})
              </button>
            </div>

            {/* Change Team Button */}
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
          </div>
        </header>

        {/* Exibição de Erro da API se houver */}
        {apiError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 text-xs font-mono">
            [API ERROR WARNING]: {apiError}
          </div>
        )}

        {/* TAB 1: TACTICAL FEED MONITOR */}
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
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Banner do Time Principal */}
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
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
