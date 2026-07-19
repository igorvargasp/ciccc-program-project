import React from "react";

interface Team {
  name: string;
  logo: string;
}

export interface MatchData {
  id: number;
  homeTeam: {
    name: string;
    logo: string;
  };
  awayTeam: {
    name: string;
    logo: string;
  };
  status: "SCHEDULED" | "LIVE" | "FINISHED";
  date: string;
  homeScore?: number;
  awayScore?: number;
  minute?: number;
}

interface MatchRowProps {
  match: MatchData;
  onSimulate?: (match: MatchData) => void;
}

export const MatchRow: React.FC<MatchRowProps> = ({ match, onSimulate }) => {
  const isLive = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";

  return (
    <div className="w-full bg-[#0c0e12] border border-[#414755]/30 hover:border-[#00d2fd]/50 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all duration-200 group">
      {/* Horário ou Minuto do Jogo */}
      <div className="flex items-center gap-3 shrink-0">
        {isLive ? (
          <div className="flex items-center gap-1.5 bg-red-600/10 border border-red-500/30 px-2.5 py-1 text-[11px] font-bold text-red-500 tracking-wider uppercase animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block"></span>
            LIVE {match.minute}'
          </div>
        ) : isFinished ? (
          <div className="bg-[#1a1c20] border border-[#414755]/40 px-2.5 py-1 text-[11px] font-bold text-[#8b90a0] tracking-wider uppercase">
            FT
          </div>
        ) : (
          <div className="text-sm font-bold text-[#c1c6d7]">
            {new Date(match.date).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </div>

      {/* Confronto centralizado (Times e Placar) */}
      <div className="flex-1 grid grid-cols-7 items-center w-full max-w-xl mx-auto">
        {/* Mandante */}
        <div className="col-span-3 flex items-center justify-end gap-3 text-right">
          <span className="text-sm font-semibold tracking-wide text-[#e2e2e8] group-hover:text-[#00d2fd] transition-colors truncate">
            {match.homeTeam.name}
          </span>
          <img
            src={match.homeTeam.logo}
            alt={match.homeTeam.name}
            className="w-6 h-6 object-contain"
          />
        </div>

        {/* Placar / VS */}
        <div className="col-span-1 flex items-center justify-center bg-[#111317] border border-[#414755]/20 h-8 mx-2 px-2 font-black tracking-widest text-sm text-[#00d2fd]">
          {isFinished || isLive ? (
            <span>
              {match.homeScore} - {match.awayScore}
            </span>
          ) : (
            <span className="text-[10px] text-[#8b90a0] font-bold">VS</span>
          )}
        </div>

        {/* Visitante */}
        <div className="col-span-3 flex items-center justify-start gap-3 text-left">
          <img
            src={match.awayTeam.logo}
            alt={match.awayTeam.name}
            className="w-6 h-6 object-contain"
          />
          <span className="text-sm font-semibold tracking-wide text-[#e2e2e8] group-hover:text-[#00d2fd] transition-colors truncate">
            {match.awayTeam.name}
          </span>
        </div>
      </div>

      {/* Ação: Simular Partida */}
      <div className="shrink-0 w-full sm:w-auto flex justify-end">
        <button
          onClick={() => onSimulate?.(match)}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 border border-[#414755] bg-[#1a1c20]/50 hover:bg-[#00d2fd] hover:text-[#00285c] hover:border-[#00d2fd] px-3 py-1.5 text-xs font-bold tracking-wider uppercase transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">
            sports_esports
          </span>
          Simulate
        </button>
      </div>
    </div>
  );
};
