import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

interface Player {
  id: string | number;
  fullName: string; // Atualizado para corresponder ao seu schema do backend
  photoUrl?: string | null; // Atualizado aqui
  position: string;
}

interface PlayerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlayer: (player: Player) => void;
  positionFilter?: string; // Opcional: para filtrar pela posição do slot (ex: "GK", "DEF", etc.)
}

export default function PlayerSearchModal({
  isOpen,
  onClose,
  onSelectPlayer,
  positionFilter,
}: PlayerSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPlayers = async () => {
      setLoading(true);
      try {
        // Constrói osquery params com base no que sua API aceita
        const params = new URLSearchParams();
        if (searchTerm) params.append("search", searchTerm);
        if (positionFilter) params.append("position", positionFilter);
        params.append("limit", "20"); // Limita a 20 resultados para otimizar

        const response = await fetch(`/api/players?${params.toString()}`);
        const result = await response.json();

        // A sua API retorna { data: rows }
        setPlayers(result.data || []);
      } catch (error) {
        console.error("Erro ao buscar jogadores:", error);
      } finally {
        setLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchPlayers();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, isOpen, positionFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#14171c] border border-[#414755]/40 rounded-xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        {/* Cabeçalho do Modal */}
        <div className="flex items-center justify-between p-4 border-b border-[#414755]/30">
          <h3 className="text-xs font-black text-[#00d2fd] uppercase tracking-[0.2em]">
            Select Player {positionFilter ? `(${positionFilter})` : ""}
          </h3>
          <button
            onClick={onClose}
            className="text-[#8b90a0] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Pesquisa */}
        <div className="p-4 border-b border-[#414755]/30">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8b90a0]" />
            <input
              type="text"
              placeholder="Search player by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0d0f12] border border-[#414755]/40 rounded-lg pl-9 pr-3 py-2 text-xs font-bold text-[#e2e2e8] focus:outline-none focus:border-[#00d2fd] transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* Lista de Jogadores */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <p className="text-center text-xs text-[#8b90a0] py-6">
              Loading players...
            </p>
          ) : players.length === 0 ? (
            <p className="text-center text-xs text-[#8b90a0] py-6">
              No players found.
            </p>
          ) : (
            players.map((player) => (
              <div
                key={player.id}
                onClick={() => onSelectPlayer(player)}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-[#0d0f12] border border-[#414755]/20 hover:border-[#00d2fd] cursor-pointer transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-[#14171c] overflow-hidden flex-shrink-0 border border-[#414755]/40 flex items-center justify-center">
                  {player.photoUrl ? (
                    <img
                      src={player.photoUrl}
                      alt={player.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-bold text-[#8b90a0]">
                      {player.fullName.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-[#00d2fd] transition-colors">
                    {player.fullName}
                  </h4>
                  <p className="text-[10px] text-[#8b90a0]">
                    {player.position}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
