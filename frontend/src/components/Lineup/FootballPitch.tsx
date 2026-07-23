"use client";

import React, { useState } from "react";

// Definição das formações e posições (coordenadas x/y percentuais no campo)
const FORMATIONS: Record<string, { role: string; x: number; y: number }[]> = {
  "4-3-3": [
    { role: "GK", x: 50, y: 88 },
    { role: "LB", x: 15, y: 70 },
    { role: "CB", x: 38, y: 72 },
    { role: "CB", x: 62, y: 72 },
    { role: "RB", x: 85, y: 70 },
    { role: "CDM", x: 50, y: 55 },
    { role: "CM", x: 32, y: 45 },
    { role: "CM", x: 68, y: 45 },
    { role: "LW", x: 18, y: 25 },
    { role: "ST", x: 50, y: 20 },
    { role: "RW", x: 82, y: 25 },
  ],
  "4-4-2": [
    { role: "GK", x: 50, y: 88 },
    { role: "LB", x: 15, y: 70 },
    { role: "CB", x: 38, y: 72 },
    { role: "CB", x: 62, y: 72 },
    { role: "RB", x: 85, y: 70 },
    { role: "LM", x: 15, y: 45 },
    { role: "CM", x: 38, y: 48 },
    { role: "CM", x: 62, y: 48 },
    { role: "RM", x: 85, y: 45 },
    { role: "ST", x: 38, y: 22 },
    { role: "ST", x: 62, y: 22 },
  ],
  "3-5-2": [
    { role: "GK", x: 50, y: 88 },
    { role: "CB", x: 25, y: 72 },
    { role: "CB", x: 50, y: 75 },
    { role: "CB", x: 75, y: 72 },
    { role: "LWB", x: 12, y: 45 },
    { role: "CM", x: 38, y: 50 },
    { role: "CDM", x: 50, y: 60 },
    { role: "CM", x: 62, y: 50 },
    { role: "RWB", x: 88, y: 45 },
    { role: "ST", x: 38, y: 22 },
    { role: "ST", x: 62, y: 22 },
  ],
};

interface Player {
  name: string;
  photo?: string;
  position: string;
}

interface FootballPitchProps {
  formation: string;
  lineupPlayers: Record<number, Player>;
  onSelectSlot: (index: number) => void;
}

export default function FootballPitch({
  formation,
  lineupPlayers,
  onSelectSlot,
}: FootballPitchProps) {
  const currentFormation = FORMATIONS[formation] || FORMATIONS["4-3-3"];

  return (
    <div className="relative w-full max-w-4xl h-[650px] bg-gradient-to-b from-[#0e3a2f] to-[#08241e] border-2 border-[#00d2fd]/40 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center justify-center p-4">
      {/* Marcações do Campo (Estilo Tático) */}
      <div className="absolute inset-4 border border-white/25 rounded pointer-events-none">
        {/* Meio de campo */}
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/25"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-white/25 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/40 rounded-full"></div>

        {/* Área Superior (Ataque) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-24 border-b border-x border-white/25"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-10 border-b border-x border-white/25"></div>

        {/* Área Inferior (Defesa) */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 h-24 border-t border-x border-white/25"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-10 border-t border-x border-white/25"></div>
      </div>

      {/* Renderização dos Slots de Jogadores */}
      <div className="absolute inset-0">
        {currentFormation.map((pos, index) => {
          const player = lineupPlayers[index];
          return (
            <div
              key={index}
              style={{ top: `${pos.y}%`, left: `${pos.x}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
              onClick={() => onSelectSlot(index)}
            >
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-[#14171c]/90 border-2 border-[#00d2fd] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                {player?.photo ? (
                  <img
                    src={player.photo}
                    alt={player.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <span className="text-xs font-black text-[#00d2fd] uppercase tracking-tighter">
                    {pos.role}
                  </span>
                )}
              </div>
              <span className="mt-1 px-2 py-0.5 bg-black/70 backdrop-blur-xs border border-[#414755]/40 rounded text-[10px] font-bold text-[#e2e2e8] uppercase tracking-wide truncate max-w-[100px] text-center">
                {player ? player.name : `Add ${pos.role}`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
