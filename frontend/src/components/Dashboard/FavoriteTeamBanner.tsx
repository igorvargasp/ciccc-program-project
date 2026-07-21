import React, { useState, useEffect } from "react";

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

export function Dashboard() {
  const [favoriteTeam, setFavoriteTeam] = useState<Team | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [activeTab, setActiveTab] = useState<"feed" | "selector">("feed");

  // 1. Carrega o time salvo no localStorage e busca dados estatísticos reais na API
  useEffect(() => {
    const savedTeamRaw = localStorage.getItem("favorite_team");
    if (!savedTeamRaw) return;

    try {
      const savedTeam: Team = JSON.parse(savedTeamRaw);
      setFavoriteTeam(savedTeam);

      // Busca dados analíticos do time na API-Sports
      fetchTeamStatistics(savedTeam);
    } catch (err) {
      console.error("Erro ao ler time favorito do localStorage:", err);
    }
  }, []);

  const fetchTeamStatistics = async (team: Team) => {
    setIsLoadingStats(true);
    try {
      const apiKey = import.meta.env.VITE_FOOTBALL_API_KEY;

      // Nota: Usamos league=71 (Brasileirão) ou league=39 (Premier League) como fallback padrão se não soubermos a liga
      // Para buscar stats de um time precisamos de team + season (+ league opcional)
      const currentYear = new Date().getFullYear();
      const res = await fetch(
        `https://v3.football.api-sports.io/teams/statistics?team=${team.id}&season=${currentYear - 1}`,
        {
          method: "GET",
          headers: {
            "x-apisports-key": apiKey,
          },
        },
      );

      const data = await res.json();

      if (data.response) {
        const statsData = data.response;
        const totalMatches = statsData.fixtures?.played?.total || 1;
        const wins = statsData.fixtures?.wins?.total || 0;
        const winRateCalc = Math.round((wins / totalMatches) * 100) + "%";

        setFavoriteTeam((prev) =>
          prev
            ? {
                ...prev,
                league:
                  statsData.league?.name || prev.country || "National League",
                stats: {
                  winRate: winRateCalc,
                  goalsScored: statsData.goals?.for?.total?.total || 0,
                  cleanSheets: statsData.clean_sheet?.total || 0,
                },
              }
            : null,
        );
      }
    } catch (err) {
      console.error("Erro ao buscar estatísticas do time:", err);
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

          {/* Navigation Controls */}
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
        </header>

        {/* TAB 1: TACTICAL FEED MONITOR */}
        {activeTab === "feed" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left/Center Column: Telemetry Cards */}
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
                      API LINKED
                    </span>
                  </div>

                  {/* Performance Indicators */}
                  {isLoadingStats ? (
                    <div className="py-8 text-center text-xs text-[#00d2fd] animate-pulse">
                      Syncing match statistics from API-Sports...
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 border-t border-[#414755]/30 pt-5 text-center">
                      <div className="bg-[#0d0f12]/80 p-3 border border-[#414755]/20">
                        <span className="block text-[10px] font-bold text-[#8b90a0] uppercase tracking-wider mb-1">
                          Win Rate
                        </span>
                        <span className="text-xl font-black text-[#00d2fd]">
                          {favoriteTeam.stats?.winRate || "N/A"}
                        </span>
                      </div>
                      <div className="bg-[#0d0f12]/80 p-3 border border-[#414755]/20">
                        <span className="block text-[10px] font-bold text-[#8b90a0] uppercase tracking-wider mb-1">
                          Goals
                        </span>
                        <span className="text-xl font-black text-[#4b8eff]">
                          {favoriteTeam.stats?.goalsScored ?? "N/A"}
                        </span>
                      </div>
                      <div className="bg-[#0d0f12]/80 p-3 border border-[#414755]/20">
                        <span className="block text-[10px] font-bold text-[#8b90a0] uppercase tracking-wider mb-1">
                          C. Sheets
                        </span>
                        <span className="text-xl font-black text-[#e2e2e8]">
                          {favoriteTeam.stats?.cleanSheets ?? "N/A"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Predictive Operations */}
            <div className="space-y-6">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#8b90a0] flex items-center gap-2">
                <span className="w-2 h-2 bg-[#4b8eff] rounded-full"></span>
                System Operations
              </h2>

              <div className="bg-[#14171c] border border-[#414755]/30 p-6 space-y-4 relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 opacity-[0.03] text-[#00d2fd] pointer-events-none select-none">
                  <span className="material-symbols-outlined text-[140px]">
                    analytics
                  </span>
                </div>
                <h3 className="font-bold text-lg uppercase tracking-tight">
                  Predictive Analytics Engine
                </h3>
                <p className="text-xs text-[#8b90a0] leading-relaxed">
                  Ready to compute dynamic tactical outcomes based on current
                  database configurations and telemetry filters?
                </p>
                <button className="w-full py-3 bg-[#4b8eff] hover:bg-[#00d2fd] text-[#001a41] text-xs font-black uppercase tracking-widest transition-all cursor-pointer">
                  Launch Match Simulator
                </button>
              </div>
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
                <img
                  src={favoriteTeam.badgeUrl}
                  alt={favoriteTeam.name}
                  className="w-12 h-12 object-contain"
                />
                <div>
                  <p className="font-bold text-sm text-[#e2e2e8] uppercase">
                    {favoriteTeam.name}
                  </p>
                  <p className="text-xs text-[#8b90a0]">
                    ID: {favoriteTeam.id} | Country: {favoriteTeam.country}
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
