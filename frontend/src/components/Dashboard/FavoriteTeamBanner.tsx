import React, { useState } from "react";

// Tipagem dos times da liga
interface Team {
  id: string;
  name: string;
  tag: string;
  logo: string;
  league: string;
  stats: {
    winRate: string;
    goalsScored: number;
    cleanSheets: number;
  };
}

// Mock inicial de dados baseado na arquitetura esportiva do ALI SCORE
const AVAILABLE_TEAMS: Team[] = [
  {
    id: "t1",
    name: "Real Madrid",
    tag: "RMA",
    logo: "sports_soccer",
    league: "La Liga",
    stats: { winRate: "78%", goalsScored: 64, cleanSheets: 14 },
  },
  {
    id: "t2",
    name: "Manchester City",
    tag: "MCI",
    logo: "sports_soccer",
    league: "Premier League",
    stats: { winRate: "81%", goalsScored: 72, cleanSheets: 12 },
  },
  {
    id: "t3",
    name: "Barcelona",
    tag: "FCB",
    logo: "sports_soccer",
    league: "La Liga",
    stats: { winRate: "69%", goalsScored: 58, cleanSheets: 10 },
  },
  {
    id: "t4",
    name: "Arsenal",
    tag: "ARS",
    logo: "sports_soccer",
    league: "Premier League",
    stats: { winRate: "72%", goalsScored: 61, cleanSheets: 15 },
  },
  {
    id: "t5",
    name: "Bayern Munich",
    tag: "FCB",
    logo: "sports_soccer",
    league: "Bundesliga",
    stats: { winRate: "75%", goalsScored: 68, cleanSheets: 9 },
  },
  {
    id: "t6",
    name: "Paris Saint-Germain",
    tag: "PSG",
    logo: "sports_soccer",
    league: "Ligue 1",
    stats: { winRate: "70%", goalsScored: 55, cleanSheets: 11 },
  },
];

export function Dashboard() {
  // Estado para armazenar os IDs dos times favoritados
  const [favoriteIds, setFavoriteIds] = useState<string[]>(["t1", "t2"]);
  const [activeTab, setActiveTab] = useState<"feed" | "selector">("feed");

  // Alterna o status de favorito do time
  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // Filtra os times que estão favoritados
  const favoritedTeams = AVAILABLE_TEAMS.filter((team) =>
    favoriteIds.includes(team.id),
  );

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
              Manage Squads ({favoriteIds.length})
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

              {favoritedTeams.length === 0 ? (
                <div className="bg-[#14171c] border border-dashed border-[#414755]/40 p-12 text-center space-y-4">
                  <span className="material-symbols-outlined text-[#414755] text-5xl">
                    monitoring
                  </span>
                  <p className="text-sm text-[#8b90a0] max-w-xs mx-auto">
                    No squads currently locked into the system telemetry array.
                    Switch to the management tab to initialize tracking.
                  </p>
                  <button
                    onClick={() => setActiveTab("selector")}
                    className="px-4 py-2 bg-[#00d2fd]/10 border border-[#00d2fd]/30 text-[#00d2fd] text-xs font-bold uppercase tracking-widest hover:bg-[#00d2fd]/20 transition-all cursor-pointer"
                  >
                    Link Favorites
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {favoritedTeams.map((team) => (
                    <div
                      key={team.id}
                      className="bg-[#14171c] border border-[#414755]/30 p-6 relative group transition-all duration-300 hover:border-[#4b8eff]/50"
                    >
                      <div className="absolute top-0 left-0 w-[2px] h-0 bg-[#4b8eff] transition-all duration-300 group-hover:h-full"></div>

                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#0d0f12] border border-[#414755]/30 flex items-center justify-center text-[#00d2fd]">
                            <span className="material-symbols-outlined text-xl">
                              {team.logo}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-base tracking-wide uppercase">
                              {team.name}
                            </h3>
                            <span className="text-[10px] text-[#8b90a0] uppercase tracking-wider font-semibold">
                              {team.league}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-black bg-[#0d0f12] border border-[#414755]/20 px-2 py-0.5 text-[#e2e2e8]">
                          {team.tag}
                        </span>
                      </div>

                      {/* Performance Indicators */}
                      <div className="grid grid-cols-3 gap-2 border-t border-[#414755]/20 pt-4 text-center">
                        <div className="bg-[#0d0f12]/50 p-2 border border-[#414755]/10">
                          <span className="block text-[10px] font-bold text-[#8b90a0] uppercase tracking-wider">
                            Win Rate
                          </span>
                          <span className="text-lg font-black text-[#00d2fd]">
                            {team.stats.winRate}
                          </span>
                        </div>
                        <div className="bg-[#0d0f12]/50 p-2 border border-[#414755]/10">
                          <span className="block text-[10px] font-bold text-[#8b90a0] uppercase tracking-wider">
                            Goals
                          </span>
                          <span className="text-lg font-black text-[#4b8eff]">
                            {team.stats.goalsScored}
                          </span>
                        </div>
                        <div className="bg-[#0d0f12]/50 p-2 border border-[#414755]/10">
                          <span className="block text-[10px] font-bold text-[#8b90a0] uppercase tracking-wider">
                            C. Sheets
                          </span>
                          <span className="text-lg font-black text-[#e2e2e8]">
                            {team.stats.cleanSheets}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Algorithmic Match Simulator Access / Quick Stats */}
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

        {/* TAB 2: INTERACTIVE FAVORITE SELECTOR */}
        {activeTab === "selector" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold uppercase tracking-tight">
                  Database Squad Directory
                </h2>
                <p className="text-xs text-[#8b90a0]">
                  Toggle tracking switches to stream network feeds onto your
                  tactical workspace.
                </p>
              </div>
              <div className="text-xs font-mono text-[#8b90a0] bg-[#14171c] border border-[#414755]/30 px-3 py-1.5 self-start">
                INDEXED_ITEMS:{" "}
                <span className="text-[#00d2fd]">{AVAILABLE_TEAMS.length}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {AVAILABLE_TEAMS.map((team) => {
                const isFavorited = favoriteIds.includes(team.id);
                return (
                  <div
                    key={team.id}
                    onClick={() => toggleFavorite(team.id)}
                    className={`border p-5 flex items-center justify-between transition-all duration-200 cursor-pointer select-none group ${
                      isFavorited
                        ? "bg-[#00d2fd]/5 border-[#00d2fd] shadow-md shadow-[#00d2fd]/5"
                        : "bg-[#14171c] border-[#414755]/30 hover:border-[#8b90a0]/50"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-9 h-9 border flex items-center justify-center transition-colors ${
                          isFavorited
                            ? "bg-[#00d2fd]/20 border-[#00d2fd] text-[#00d2fd]"
                            : "bg-[#0d0f12] border-[#414755]/40 text-[#414755] group-hover:text-[#8b90a0]"
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">
                          {team.logo}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-sm tracking-wide uppercase text-[#e2e2e8]">
                          {team.name}
                        </h3>
                        <p className="text-[10px] text-[#8b90a0] uppercase tracking-wider font-semibold">
                          {team.league}
                        </p>
                      </div>
                    </div>

                    {/* Status Toggle Pin */}
                    <div
                      className={`w-5 h-5 border flex items-center justify-center transition-all ${
                        isFavorited
                          ? "border-[#00d2fd] bg-[#00d2fd] text-[#001a41]"
                          : "border-[#414755]/60 bg-transparent text-transparent group-hover:border-[#8b90a0]"
                      }`}
                    >
                      {isFavorited && (
                        <span className="material-symbols-outlined text-xs font-black">
                          done
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
