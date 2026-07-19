import React, { useState, useEffect } from "react";

interface Team {
  name: string;
  logo: string;
}

interface MatchSimulatorProps {
  homeTeam?: Team;
  awayTeam?: Team;
  onFinish?: (homeScore: number, awayScore: number) => void;
}

interface MatchEvent {
  minute: number;
  type: "goal" | "card" | "substitution" | "whistle";
  team: "home" | "away" | "neutral";
  detail: string;
}

export const MatchSimulator: React.FC<MatchSimulatorProps> = ({
  homeTeam = { name: "Home Team", logo: "" },
  awayTeam = { name: "Away Team", logo: "" },
  onFinish,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [minute, setMinute] = useState(0);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [events, setEvents] = useState<MatchEvent[]>([]);

  // Estatísticas simuladas dinamicamente
  const [stats, setStats] = useState({
    homePossession: 50,
    awayPossession: 50,
    homeShots: 0,
    awayShots: 0,
    homeFouls: 0,
    awayFouls: 0,
  });

  useEffect(() => {
    let interval: number;

    if (isPlaying && minute < 90) {
      interval = setInterval(() => {
        setMinute((prev) => {
          const nextMin = prev + 1;

          // Dispara gerador lógico de eventos aleatórios
          simulateEvent(nextMin);

          if (nextMin >= 90) {
            setIsPlaying(false);
            setEvents((prevEvents) => [
              {
                minute: 90,
                type: "whistle",
                team: "neutral",
                detail: `Full Time! Final whistle blows. Final Score: ${homeTeam.name} ${homeScore} - ${awayScore} ${awayTeam.name}.`,
              },
              ...prevEvents,
            ]);
            if (onFinish) onFinish(homeScore, awayScore);
          }
          return nextMin;
        });
      }, 250); // Velocidade da simulação (250ms por minuto de partida)
    }

    return () => clearInterval(interval);
  }, [isPlaying, minute, homeScore, awayScore, homeTeam, awayTeam]);

  const simulateEvent = (currentMin: number) => {
    const chance = Math.random();

    // Flutuação da posse de bola (-3% a +3%)
    setStats((prev) => {
      const shift = Math.floor(Math.random() * 7) - 3;
      const nextHome = Math.max(30, Math.min(70, prev.homePossession + shift));
      return {
        ...prev,
        homePossession: nextHome,
        awayPossession: 100 - nextHome,
      };
    });

    // Chance de Finalização (15%)
    if (chance < 0.15) {
      const isHome = Math.random() > 0.48; // Leve vantagem estatística para o mandante
      if (isHome) {
        setStats((p) => ({ ...p, homeShots: p.homeShots + 1 }));
        // Chance de Conversão em Gol (18%)
        if (Math.random() < 0.18) {
          setHomeScore((s) => s + 1);
          setEvents((e) => [
            {
              minute: currentMin,
              type: "goal",
              team: "home",
              detail: `GOAL for ${homeTeam.name}! Outstanding strike finding the back of the net!`,
            },
            ...e,
          ]);
        }
      } else {
        setStats((p) => ({ ...p, awayShots: p.awayShots + 1 }));
        if (Math.random() < 0.18) {
          setAwayScore((s) => s + 1);
          setEvents((e) => [
            {
              minute: currentMin,
              type: "goal",
              team: "away",
              detail: `GOAL for ${awayTeam.name}! Clinical finish on a quick counter-attack!`,
            },
            ...e,
          ]);
        }
      }
    }
    // Chance de Falta ou Cartões (8%)
    else if (chance < 0.23) {
      const isHome = Math.random() > 0.5;
      if (isHome) {
        setStats((p) => ({ ...p, homeFouls: p.homeFouls + 1 }));
        if (Math.random() < 0.25) {
          setEvents((e) => [
            {
              minute: currentMin,
              type: "card",
              team: "home",
              detail: `Yellow Card to ${homeTeam.name} for a tactical foul.`,
            },
            ...e,
          ]);
        }
      } else {
        setStats((p) => ({ ...p, awayFouls: p.awayFouls + 1 }));
        if (Math.random() < 0.25) {
          setEvents((e) => [
            {
              minute: currentMin,
              type: "card",
              team: "away",
              detail: `Yellow Card to ${awayTeam.name} following a late sliding tackle.`,
            },
            ...e,
          ]);
        }
      }
    }
  };

  const startSimulation = () => {
    setMinute(0);
    setHomeScore(0);
    setAwayScore(0);
    setEvents([
      {
        minute: 0,
        type: "whistle",
        team: "neutral",
        detail: `Match Started! Kick-off between ${homeTeam.name} and ${awayTeam.name}.`,
      },
    ]);
    setStats({
      homePossession: 50,
      awayPossession: 50,
      homeShots: 0,
      awayShots: 0,
      homeFouls: 0,
      awayFouls: 0,
    });
    setIsPlaying(true);
  };

  return (
    <div className="w-full bg-[#1e2024] border border-[#414755] p-6 shadow-2xl font-['Archivo_Narrow'] text-[#e2e2e8]">
      {/* Top Banner Info */}
      <div className="flex justify-between items-center mb-6 border-b border-[#414755]/30 pb-4">
        <div>
          <span className="text-[10px] font-black tracking-widest text-[#00d2fd] uppercase bg-[#00d2fd]/10 px-2 py-0.5 border border-[#00d2fd]/20">
            ALI ENGINE v1.2
          </span>
          <h2 className="text-xl font-bold uppercase tracking-wider mt-1">
            Live Match Simulator
          </h2>
        </div>
        <div className="bg-[#0c0e12] border border-[#414755] px-4 py-1.5 text-sm font-bold tracking-widest text-[#00d2fd] min-w-[60px] text-center">
          {minute === 0 ? "00:00" : minute === 90 ? "FT" : `${minute}'`}
        </div>
      </div>

      {/* Placar Centralizado */}
      <div className="grid grid-cols-3 items-center bg-[#0c0e12] border border-[#414755]/60 p-6 mb-8 text-center">
        {/* Time da Casa */}
        <div className="flex flex-col items-center gap-2">
          {homeTeam.logo && (
            <img
              src={homeTeam.logo}
              alt={homeTeam.name}
              className="w-12 h-12 object-contain"
            />
          )}
          <div className="text-base font-bold uppercase tracking-wide text-[#e2e2e8]">
            {homeTeam.name}
          </div>
          <span className="text-[9px] uppercase font-bold tracking-widest text-[#8b90a0]">
            HOME
          </span>
        </div>

        {/* Placar e Botões */}
        <div className="flex flex-col items-center justify-center">
          <div className="text-5xl font-black tracking-widest text-[#00d2fd] select-none tab-nums">
            {homeScore} : {awayScore}
          </div>
          <button
            onClick={startSimulation}
            disabled={isPlaying}
            className={`mt-4 px-5 py-2 font-bold tracking-widest text-xs uppercase border transition-all cursor-pointer ${
              isPlaying
                ? "border-[#414755] text-[#8b90a0] bg-transparent cursor-not-allowed"
                : "border-[#00d2fd] text-[#00285c] bg-[#00d2fd] hover:bg-transparent hover:text-[#00d2fd]"
            }`}
          >
            {minute === 90
              ? "Restart Match"
              : isPlaying
                ? "Simulating Live..."
                : "Kick Off"}
          </button>
        </div>

        {/* Time Visitante */}
        <div className="flex flex-col items-center gap-2">
          {awayTeam.logo && (
            <img
              src={awayTeam.logo}
              alt={awayTeam.name}
              className="w-12 h-12 object-contain"
            />
          )}
          <div className="text-base font-bold uppercase tracking-wide text-[#e2e2e8]">
            {awayTeam.name}
          </div>
          <span className="text-[9px] uppercase font-bold tracking-widest text-[#8b90a0]">
            AWAY
          </span>
        </div>
      </div>

      {/* Painel de Estatísticas e Logs */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Coluna de Estatísticas */}
        <div className="md:col-span-5 space-y-4 bg-[#0c0e12]/40 border border-[#414755]/30 p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#8b90a0] border-b border-[#414755]/20 pb-2">
            Match Data
          </h3>

          {/* Posse de bola */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span>{stats.homePossession}%</span>
              <span className="text-[#8b90a0] text-[10px] tracking-wider uppercase">
                Possession
              </span>
              <span>{stats.awayPossession}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#1e2024] flex">
              <div
                className="h-full bg-[#00d2fd] transition-all duration-300"
                style={{ width: `${stats.homePossession}%` }}
              />
              <div
                className="h-full bg-[#414755] transition-all duration-300"
                style={{ width: `${stats.awayPossession}%` }}
              />
            </div>
          </div>

          {/* Chutes */}
          <div className="flex justify-between items-center text-sm border-b border-[#414755]/10 py-1.5">
            <span className="font-bold text-[#00d2fd]">{stats.homeShots}</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b90a0]">
              Shots
            </span>
            <span className="font-bold text-[#e2e2e8]">{stats.awayShots}</span>
          </div>

          {/* Faltas */}
          <div className="flex justify-between items-center text-sm border-b border-[#414755]/10 py-1.5">
            <span className="font-bold text-[#00d2fd]">{stats.homeFouls}</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b90a0]">
              Fouls
            </span>
            <span className="font-bold text-[#e2e2e8]">{stats.awayFouls}</span>
          </div>
        </div>

        {/* Feed de Eventos Minuto a Minuto */}
        <div className="md:col-span-7 flex flex-col bg-[#0c0e12]/40 border border-[#414755]/30 p-4 h-[250px]">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#8b90a0] border-b border-[#414755]/20 pb-2 mb-3">
            Commentary Feed
          </h3>
          <div className="overflow-y-auto flex-1 space-y-2.5 pr-1 text-xs">
            {events.length === 0 ? (
              <div className="text-center text-[#8b90a0]/40 py-12 italic">
                Click Kick Off to launch match logging analytics...
              </div>
            ) : (
              events.map((event, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 border-l-2 border-[#414755]/40 pl-2.5 py-0.5 items-start"
                >
                  <span
                    className={`font-bold shrink-0 ${event.type === "goal" ? "text-yellow-400 font-extrabold" : "text-[#00d2fd]"}`}
                  >
                    {event.minute}'
                  </span>
                  <span className="material-symbols-outlined text-[15px] shrink-0 text-[#8b90a0] select-none">
                    {event.type === "goal"
                      ? "sports_soccer"
                      : event.type === "card"
                        ? "style"
                        : "sports"}
                  </span>
                  <p className="text-[#c1c6d7] leading-tight font-medium">
                    {event.detail}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
