import React from "react";

interface TeamStanding {
  position: number;
  name: string;
  logo: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: ("W" | "D" | "L")[];
}

const leagueData: TeamStanding[] = [
  {
    position: 1,
    name: "Real Madrid",
    logo: "https://crests.football-data.org/86.svg",
    played: 28,
    won: 21,
    drawn: 6,
    lost: 1,
    goalsFor: 64,
    goalsAgainst: 20,
    goalDifference: 44,
    points: 69,
    form: ["W", "W", "D", "W", "W"],
  },
  {
    position: 2,
    name: "Barcelona",
    logo: "https://crests.football-data.org/81.svg",
    played: 28,
    won: 18,
    drawn: 7,
    lost: 3,
    goalsFor: 57,
    goalsAgainst: 34,
    goalDifference: 23,
    points: 61,
    form: ["W", "D", "W", "W", "L"],
  },
  {
    position: 3,
    name: "Girona",
    logo: "https://crests.football-data.org/558.svg",
    played: 28,
    won: 19,
    drawn: 5,
    lost: 4,
    goalsFor: 59,
    goalsAgainst: 33,
    goalDifference: 26,
    points: 62,
    form: ["L", "W", "L", "W", "L"],
  },
  {
    position: 4,
    name: "Atletico Madrid",
    logo: "https://crests.football-data.org/78.svg",
    played: 28,
    won: 17,
    drawn: 4,
    lost: 7,
    goalsFor: 54,
    goalsAgainst: 31,
    goalDifference: 23,
    points: 55,
    form: ["W", "L", "D", "W", "L"],
  },
  {
    position: 5,
    name: "Athletic Club",
    logo: "https://crests.football-data.org/77.svg",
    played: 28,
    won: 15,
    drawn: 8,
    lost: 5,
    goalsFor: 48,
    goalsAgainst: 26,
    goalDifference: 22,
    points: 53,
    form: ["W", "D", "L", "W", "D"],
  },
];

export const StandingsTable: React.FC = () => {
  return (
    <div className="w-full bg-[#1e2024] border border-[#414755] p-6 shadow-2xl font-['Archivo_Narrow'] text-[#e2e2e8]">
      {/* Cabeçalho do Card */}
      <div className="flex justify-between items-center mb-6 border-b border-[#414755]/30 pb-4">
        <div>
          <span className="text-[10px] font-black tracking-widest text-[#00d2fd] uppercase bg-[#00d2fd]/10 px-2 py-0.5 border border-[#00d2fd]/20">
            LIVE STANDINGS
          </span>
          <h2 className="text-xl font-bold uppercase tracking-wider mt-1">
            League Table
          </h2>
        </div>
      </div>

      {/* Tabela Responsiva */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-[#414755]/40 text-[#8b90a0] text-xs font-bold uppercase tracking-wider">
              <th className="py-3 px-2 text-center w-12">Pos</th>
              <th className="py-3 px-2">Club</th>
              <th className="py-3 px-2 text-center w-12">P</th>
              <th className="py-3 px-2 text-center w-10">W</th>
              <th className="py-3 px-2 text-center w-10">D</th>
              <th className="py-3 px-2 text-center w-10">L</th>
              <th className="py-3 px-2 text-center w-14">GD</th>
              <th className="py-3 px-2 text-center w-14 text-[#00d2fd]">PTS</th>
              <th className="py-3 px-2 text-center w-36 hidden sm:table-cell">
                Form
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#414755]/20 text-sm">
            {leagueData.map((team) => {
              // Zonas de classificação clássicas
              const isUCL = team.position <= 4;

              return (
                <tr
                  key={team.position}
                  className="hover:bg-[#0c0e12]/40 transition-colors group"
                >
                  {/* Posição com indicador visual de Zona de Classificação */}
                  <td className="py-3.5 px-2 text-center font-bold relative">
                    {isUCL && (
                      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#00d2fd]" />
                    )}
                    <span
                      className={isUCL ? "text-[#00d2fd]" : "text-[#8b90a0]"}
                    >
                      {team.position}
                    </span>
                  </td>

                  {/* Nome e Escudo do Time */}
                  <td className="py-3.5 px-2 font-bold text-[#e2e2e8] group-hover:text-[#ffffff] transition-colors">
                    <div className="flex items-center gap-3">
                      {team.logo && (
                        <img
                          src={team.logo}
                          alt={team.name}
                          className="w-5 h-5 object-contain shrink-0"
                        />
                      )}
                      <span className="tracking-wide">{team.name}</span>
                    </div>
                  </td>

                  {/* Estatísticas Numéricas */}
                  <td className="py-3.5 px-2 text-center font-medium text-[#c1c6d7]">
                    {team.played}
                  </td>
                  <td className="py-3.5 px-2 text-center text-[#c1c6d7]">
                    {team.won}
                  </td>
                  <td className="py-3.5 px-2 text-center text-[#c1c6d7]">
                    {team.drawn}
                  </td>
                  <td className="py-3.5 px-2 text-center text-[#c1c6d7]">
                    {team.lost}
                  </td>
                  <td
                    className={`py-3.5 px-2 text-center font-medium ${team.goalDifference > 0 ? "text-green-400" : "text-red-400"}`}
                  >
                    {team.goalDifference > 0
                      ? `+${team.goalDifference}`
                      : team.goalDifference}
                  </td>

                  {/* Pontos Destacados */}
                  <td className="py-3.5 px-2 text-center font-black text-base text-[#00d2fd] tab-nums">
                    {team.points}
                  </td>

                  {/* Histórico Recente (Form) */}
                  <td className="py-3.5 px-2 hidden sm:table-cell">
                    <div className="flex justify-center gap-1">
                      {team.form.map((result, idx) => (
                        <span
                          key={idx}
                          className={`w-5 h-5 rounded-sm text-[10px] font-black flex items-center justify-center select-none ${
                            result === "W"
                              ? "bg-green-500/10 border border-green-500/30 text-green-400"
                              : result === "D"
                                ? "bg-yellow-500/10 border border-yellow-500/30 text-yellow-400"
                                : "bg-red-500/10 border border-red-500/30 text-red-400"
                          }`}
                        >
                          {result}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legenda das Zonas no Rodapé */}
      <div className="mt-4 pt-3 border-t border-[#414755]/20 flex items-center gap-4 text-[11px] text-[#8b90a0] uppercase font-bold tracking-wider">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-[#00d2fd] block" />
          Champions League Group Stage
        </div>
      </div>
    </div>
  );
};
