import React, { useState } from "react";
import { MatchRow } from "./MatchRow";
import { MatchSimulator } from "./MatchSimulator";

export interface MatchData {
  id: number;
  homeTeam: { name: string; logo: string };
  awayTeam: { name: string; logo: string };
  status: "SCHEDULED" | "LIVE" | "FINISHED"; // <- Mude aqui
  date: string;
  homeScore?: number;
  awayScore?: number;
  minute?: number;
}
// Mock temporário enquanto integra com o backend definitivo
const sampleMatches: MatchData[] = [
  {
    id: 101,
    homeTeam: {
      name: "Real Madrid",
      logo: "https://crests.football-data.org/86.svg",
    },
    awayTeam: {
      name: "Barcelona",
      logo: "https://crests.football-data.org/81.svg",
    },
    status: "SCHEDULED",
    date: new Date(Date.now() + 7200000).toISOString(),
  },
  {
    id: 102,
    homeTeam: {
      name: "Manchester City",
      logo: "https://crests.football-data.org/65.svg",
    },
    awayTeam: {
      name: "Liverpool",
      logo: "https://crests.football-data.org/64.svg",
    },
    homeScore: 2,
    awayScore: 1,
    status: "LIVE",
    minute: 74,
    date: new Date().toISOString(),
  },
  {
    id: 103,
    homeTeam: {
      name: "Bayern Munich",
      logo: "https://crests.football-data.org/5wy.svg",
    },
    awayTeam: {
      name: "Borussia Dortmund",
      logo: "https://crests.football-data.org/4.svg",
    },
    homeScore: 3,
    awayScore: 0,
    status: "FINISHED",
    date: new Date(Date.now() - 14400000).toISOString(),
  },
];

type TabType = "all" | "live" | "simulator";

export const MatchesTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [selectedMatchForSim, setSelectedMatchForSim] =
    useState<MatchData | null>(null);

  const handleSimulateSelect = (match: MatchData) => {
    setSelectedMatchForSim(match);
    setActiveTab("simulator");
  };

  const filteredMatches = sampleMatches.filter((match) => {
    if (activeTab === "live") return match.status === "LIVE";
    return true;
  });

  return (
    <div className="w-full max-w-4xl mx-auto bg-[#1e2024] border border-[#414755] p-6 shadow-2xl font-['Archivo_Narrow'] text-[#e2e2e8]">
      {/* Abas de Navegação */}
      <div className="flex border-b border-[#414755]/30 mb-6 gap-2">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
            activeTab === "all"
              ? "border-[#00d2fd] text-[#00d2fd]"
              : "border-transparent text-[#8b90a0] hover:text-[#e2e2e8]"
          }`}
        >
          All Fixtures
        </button>
        <button
          onClick={() => setActiveTab("live")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === "live"
              ? "border-red-500 text-red-500"
              : "border-transparent text-[#8b90a0] hover:text-red-400"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full bg-red-500 ${activeTab === "live" ? "animate-pulse" : ""}`}
          ></span>
          Live
        </button>
        <button
          onClick={() => setActiveTab("simulator")}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border-b-2 transition-all cursor-pointer ${
            activeTab === "simulator"
              ? "border-[#00d2fd] text-[#00d2fd]"
              : "border-transparent text-[#8b90a0] hover:text-[#e2e2e8]"
          }`}
        >
          AI Simulator
        </button>
      </div>

      {/* Conteúdo Renderizado baseado na Aba Ativa */}
      <div className="space-y-3">
        {activeTab === "simulator" ? (
          selectedMatchForSim ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-[#0c0e12] border border-[#414755]/40 p-3 text-xs">
                <span className="text-[#8b90a0]">
                  Simulating:{" "}
                  <strong className="text-[#e2e2e8]">
                    {selectedMatchForSim.homeTeam.name} vs{" "}
                    {selectedMatchForSim.awayTeam.name}
                  </strong>
                </span>
                <button
                  onClick={() => {
                    setSelectedMatchForSim(null);
                    setActiveTab("all");
                  }}
                  className="text-[#00d2fd] font-bold hover:underline uppercase cursor-pointer"
                >
                  Change Match
                </button>
              </div>
              <MatchSimulator />
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-[#414755]/40 bg-[#0c0e12]/20">
              <span className="material-symbols-outlined text-[48px] text-[#8b90a0]/40 mb-2">
                sports_esports
              </span>
              <p className="text-sm text-[#8b90a0] mb-4">
                No custom match selected for advanced simulation.
              </p>
              <button
                onClick={() => setActiveTab("all")}
                className="border border-[#00d2fd] bg-[#00d2fd]/10 hover:bg-[#00d2fd] hover:text-[#00285c] px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Pick a Match from List
              </button>
            </div>
          )
        ) : filteredMatches.length > 0 ? (
          filteredMatches.map((match) => (
            <MatchRow
              key={match.id}
              match={match}
              onSimulate={handleSimulateSelect}
            />
          ))
        ) : (
          <div className="text-center py-12 text-sm text-[#8b90a0] italic">
            No live matches at the moment.
          </div>
        )}
      </div>
    </div>
  );
};
