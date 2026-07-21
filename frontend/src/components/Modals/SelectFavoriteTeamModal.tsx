import React, { useState, useEffect } from "react";

export interface Team {
  id: string | number;
  name: string;
  badgeUrl?: string;
  country?: string;
}

interface SelectFavoriteTeamModalProps {
  isOpen: boolean;
  isFirstTime?: boolean;
  currentTeam?: Team | null;
  onConfirm: (team: Team) => void;
  onClose?: () => void;
}

// Lista local para garantir funcionamento mesmo se a cota da API zerar
const POPULAR_TEAMS: Team[] = [
  {
    id: 127,
    name: "Flamengo",
    country: "Brazil",
    badgeUrl: "https://media.api-sports.io/football/teams/127.png",
  },
  {
    id: 128,
    name: "Santos",
    country: "Brazil",
    badgeUrl: "https://media.api-sports.io/football/teams/128.png",
  },
  {
    id: 121,
    name: "Palmeiras",
    country: "Brazil",
    badgeUrl: "https://media.api-sports.io/football/teams/121.png",
  },
  {
    id: 126,
    name: "Sao Paulo",
    country: "Brazil",
    badgeUrl: "https://media.api-sports.io/football/teams/126.png",
  },
  {
    id: 131,
    name: "Corinthians",
    country: "Brazil",
    badgeUrl: "https://media.api-sports.io/football/teams/131.png",
  },
  {
    id: 130,
    name: "Gremio",
    country: "Brazil",
    badgeUrl: "https://media.api-sports.io/football/teams/130.png",
  },
  {
    id: 133,
    name: "Vasco da Gama",
    country: "Brazil",
    badgeUrl: "https://media.api-sports.io/football/teams/133.png",
  },
  {
    id: 1062,
    name: "Atletico-MG",
    country: "Brazil",
    badgeUrl: "https://media.api-sports.io/football/teams/1062.png",
  },
  {
    id: 541,
    name: "Real Madrid",
    country: "Spain",
    badgeUrl: "https://media.api-sports.io/football/teams/541.png",
  },
  {
    id: 529,
    name: "Barcelona",
    country: "Spain",
    badgeUrl: "https://media.api-sports.io/football/teams/529.png",
  },
  {
    id: 33,
    name: "Manchester United",
    country: "England",
    badgeUrl: "https://media.api-sports.io/football/teams/33.png",
  },
  {
    id: 40,
    name: "Liverpool",
    country: "England",
    badgeUrl: "https://media.api-sports.io/football/teams/40.png",
  },
  {
    id: 42,
    name: "Arsenal",
    country: "England",
    badgeUrl: "https://media.api-sports.io/football/teams/42.png",
  },
  {
    id: 505,
    name: "Inter",
    country: "Italy",
    badgeUrl: "https://media.api-sports.io/football/teams/505.png",
  },
];

export function SelectFavoriteTeamModal({
  isOpen,
  isFirstTime = false,
  currentTeam = null,
  onConfirm,
  onClose,
}: SelectFavoriteTeamModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(currentTeam);
  const [searchResults, setSearchResults] = useState<Team[]>(POPULAR_TEAMS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentTeam) {
      setSelectedTeam(currentTeam);
    }
  }, [currentTeam]);

  useEffect(() => {
    const cleanSearch = searchTerm.trim().toLowerCase();

    if (cleanSearch.length < 2) {
      setSearchResults(POPULAR_TEAMS);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);

      try {
        const apiKey = import.meta.env.VITE_FOOTBALL_API_KEY;

        const res = await fetch(
          `https://v3.football.api-sports.io/teams?search=${encodeURIComponent(cleanSearch)}`,
          {
            method: "GET",
            headers: {
              "x-apisports-key": apiKey,
            },
          },
        );

        const data = await res.json();

        // Se a API retornar erro de cota/chave, faz busca local no fallback em vez de quebrar
        if (data.errors && Object.keys(data.errors).length > 0) {
          console.warn(
            "API Error / Rate limit hit. Using local search fallback.",
            data.errors,
          );
          const localFiltered = POPULAR_TEAMS.filter((t) =>
            t.name.toLowerCase().includes(cleanSearch),
          );
          setSearchResults(localFiltered);
          return;
        }

        // Sucesso na API
        if (
          data.response &&
          Array.isArray(data.response) &&
          data.response.length > 0
        ) {
          const formattedTeams: Team[] = data.response.map((item: any) => ({
            id: item.team.id,
            name: item.team.name,
            badgeUrl: item.team.logo,
            country: item.team.country,
          }));
          setSearchResults(formattedTeams);
        } else {
          // Se a API respondeu mas não achou nada, tenta filtro local antes de zerar
          const localFiltered = POPULAR_TEAMS.filter((t) =>
            t.name.toLowerCase().includes(cleanSearch),
          );
          setSearchResults(localFiltered);
        }
      } catch (err) {
        console.error("Erro na requisição. Aplicando fallback local:", err);
        const localFiltered = POPULAR_TEAMS.filter((t) =>
          t.name.toLowerCase().includes(cleanSearch),
        );
        setSearchResults(localFiltered);
      } finally {
        setIsLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedTeam) return;
    localStorage.setItem("favorite_team", JSON.stringify(selectedTeam));
    onConfirm(selectedTeam);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-['Archivo_Narrow']">
      <div className="bg-[#14171c] border border-[#00d2fd]/30 w-full max-w-lg p-6 md:p-8 space-y-6 relative shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00d2fd] via-[#4b8eff] to-transparent"></div>

        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold text-[#00d2fd] uppercase tracking-widest bg-[#00d2fd]/10 px-2 py-0.5 border border-[#00d2fd]/20">
              {isFirstTime ? "INITIAL SETUP" : "PREFERENCES"}
            </span>
            <h2 className="text-2xl font-bold text-[#e2e2e8] uppercase tracking-tight mt-2">
              {isFirstTime ? "Select Your Main Club" : "Change Favorite Team"}
            </h2>
            <p className="text-xs text-[#8b90a0] mt-1">
              Search any club worldwide to sync telemetry and match data.
            </p>
          </div>

          {!isFirstTime && onClose && (
            <button
              onClick={onClose}
              type="button"
              className="text-[#8b90a0] hover:text-[#e2e2e8] text-xl transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Input de Busca */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-[#8b90a0] uppercase tracking-widest block">
            Search Any World Club
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-[#414755]">
              search
            </span>
            <input
              type="text"
              placeholder="e.g. Palmeiras, Santos, Real Madrid..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0d0f12] border border-[#414755]/40 py-3 pl-11 pr-4 text-[#e2e2e8] placeholder-[#8b90a0]/30 focus:outline-none focus:border-[#00d2fd] text-sm"
            />
          </div>
        </div>

        {/* Lista de Resultados */}
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-[#00d2fd]">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#00d2fd] border-t-transparent"></span>
              Searching database...
            </div>
          )}

          {!isLoading && searchResults.length === 0 && (
            <p className="text-xs text-[#8b90a0] text-center py-8">
              No clubs found for "{searchTerm}".
            </p>
          )}

          {!isLoading &&
            searchResults.map((team) => {
              const isSelected = selectedTeam?.id === team.id;
              return (
                <div
                  key={team.id}
                  onClick={() => setSelectedTeam(team)}
                  className={`flex items-center justify-between p-3 border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[#00d2fd]/10 border-[#00d2fd] text-[#e2e2e8]"
                      : "bg-[#0d0f12]/50 border-[#414755]/30 hover:border-[#00d2fd]/50 text-[#8b90a0] hover:text-[#e2e2e8]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {team.badgeUrl ? (
                      <img
                        src={team.badgeUrl}
                        alt={team.name}
                        className="w-7 h-7 object-contain"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-lg">
                        sports_soccer
                      </span>
                    )}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide">
                        {team.name}
                      </p>
                      {team.country && (
                        <p className="text-[10px] text-[#8b90a0]">
                          {team.country}
                        </p>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <span className="material-symbols-outlined text-[#00d2fd] text-sm">
                      check_circle
                    </span>
                  )}
                </div>
              );
            })}
        </div>

        {/* Botão de Confirmação */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedTeam}
          className="w-full py-3.5 bg-[#4b8eff] hover:bg-[#00d2fd] disabled:opacity-30 disabled:cursor-not-allowed text-[#001a41] text-xs font-black uppercase tracking-[0.2em] transition-all cursor-pointer shadow-lg shadow-[#4b8eff]/10"
        >
          {selectedTeam
            ? `Confirm ${selectedTeam.name}`
            : "Select a Team First"}
        </button>
      </div>
    </div>
  );
}
