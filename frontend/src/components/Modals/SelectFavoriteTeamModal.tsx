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

export function SelectFavoriteTeamModal({
  isOpen,
  isFirstTime = false,
  currentTeam = null,
  onConfirm,
  onClose,
}: SelectFavoriteTeamModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(currentTeam);
  const [searchResults, setSearchResults] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentTeam) {
      setSelectedTeam(currentTeam);
    }
  }, [currentTeam]);

  useEffect(() => {
    const cleanSearch = searchTerm.trim();

    if (cleanSearch.length < 3) {
      setSearchResults([]);
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "";

        const res = await fetch(
          `${baseUrl}/api/teams?search=${encodeURIComponent(cleanSearch)}`,
        );

        const json = await res.json();

        if (!res.ok) {
          throw new Error(
            json.error || "Error retrieving clubs from the server.",
          );
        }

        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          const formattedTeams: Team[] = json.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            badgeUrl: item.crestUrl || item.badgeUrl || item.logo,
            country: item.country,
          }));
          setSearchResults(formattedTeams);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Error in the request:", err);
        setErrorMessage(
          "Connection error while retrieving the teams from the backend.",
        );
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedTeam) return;
    localStorage.setItem("favorite_team", JSON.stringify(selectedTeam));
    window.dispatchEvent(new Event("favoriteTeamChanged"));
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
              Search any club worldwide directly from the database.
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

        {/* Search input */}
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
              placeholder="Type at least 3 letters (e.g. Real Madrid, Flamengo)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0d0f12] border border-[#414755]/40 py-3 pl-11 pr-4 text-[#e2e2e8] placeholder-[#8b90a0]/30 focus:outline-none focus:border-[#00d2fd] text-sm"
            />
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {errorMessage}
          </div>
        )}

        {/* List of Results */}
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-xs text-[#00d2fd]">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#00d2fd] border-t-transparent"></span>
              Querying database...
            </div>
          )}

          {!isLoading &&
            searchTerm.trim().length >= 3 &&
            searchResults.length === 0 &&
            !errorMessage && (
              <p className="text-xs text-[#8b90a0] text-center py-8">
                No clubs found matching "{searchTerm}".
              </p>
            )}

          {!isLoading && searchTerm.trim().length < 3 && (
            <p className="text-xs text-[#8b90a0] text-center py-8">
              Type at least 3 letters to search...
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

        {/* Confirmation Button */}
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
