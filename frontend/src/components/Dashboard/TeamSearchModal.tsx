import React, { useState, useEffect } from "react";

interface Team {
  id: number;
  name: string;
  logo: string;
}

interface TeamSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTeam: (team: Team) => void;
}

export const TeamSearchModal: React.FC<TeamSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectTeam,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);

  // Fecha o modal se clicar fora (no backdrop)
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setResults([]);
      return;
    }

    if (query.length < 3) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const formattedQuery = query
          .toLowerCase()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        const response = await fetch(
          `https://api.football-data.org/v4/teams?name=${encodeURIComponent(formattedQuery)}`,
          {
            headers: { "X-Auth-Token": import.meta.env.VITE_FOOTBALL_API_KEY },
          },
        );
        const data = await response.json();

        if (data.teams) {
          setResults(
            data.teams.map((t: any) => ({
              id: t.id,
              name: t.name,
              logo: t.crest,
            })),
          );
        }
      } catch (err) {
        console.error("Erro na busca:", err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#051429]/80 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-md bg-[#1e2024] border border-[#414755] p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-[#e2e2e8] tracking-widest uppercase">
            Select Your Club
          </h3>
          <button
            onClick={onClose}
            className="text-[#8b90a0] hover:text-[#00d2fd]"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="relative mb-6">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8b90a0]">
            search
          </span>
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teams..."
            className="w-full bg-[#0c0e12] border border-[#414755] py-3 pl-10 pr-4 text-sm text-[#e2e2e8] focus:border-[#00d2fd] focus:outline-none"
          />
        </div>

        <ul className="max-h-[300px] overflow-y-auto space-y-2">
          {loading ? (
            <li className="text-center text-[#8b90a0] py-4 text-sm">
              Searching...
            </li>
          ) : results.length > 0 ? (
            results.map((team) => (
              <li key={team.id}>
                <button
                  onClick={() => onSelectTeam(team)}
                  className="w-full flex items-center gap-3 p-3 bg-[#0c0e12] border border-[#414755]/30 hover:border-[#00d2fd] transition-all"
                >
                  <img
                    src={team.logo}
                    alt={team.name}
                    className="w-8 h-8 object-contain"
                  />
                  <span className="text-[#e2e2e8] font-medium">
                    {team.name}
                  </span>
                </button>
              </li>
            ))
          ) : (
            query.length >= 3 && (
              <li className="text-center text-[#8b90a0] py-4 text-sm">
                No teams found.
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
};
