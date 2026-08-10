import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, Globe, CheckCircle, X, Shield } from "lucide-react";

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
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(currentTeam);
  const [searchResults, setSearchResults] = useState<Team[]>([]);
  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (currentTeam) {
      setSelectedTeam(currentTeam);
    }
  }, [currentTeam]);

  // Carrega os países e a lista inicial de times ao abrir o modal
  useEffect(() => {
    if (!isOpen) return;
    const fetchInitialData = async () => {
      setIsLoading(true);
      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
        const res = await fetch(`${baseUrl}/api/teams?limit=100`);
        const json = await res.json();

        if (res.ok && json.data && Array.isArray(json.data)) {
          const formattedTeams: Team[] = json.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            badgeUrl: item.crestUrl || item.badgeUrl || item.logo,
            country: item.country,
          }));

          setSearchResults(formattedTeams);

          // Extrai todos os países únicos e ordena alfabeticamente
          const countriesSet = new Set<string>();
          json.data.forEach((item: any) => {
            if (item.country) countriesSet.add(item.country);
          });
          setAvailableCountries(Array.from(countriesSet).sort());
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);
        setErrorMessage("Connection error while retrieving teams.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitialData();
  }, [isOpen]);

  // Gerencia a busca dinâmica por texto e país
  useEffect(() => {
    if (!isOpen) return;
    const cleanSearch = searchTerm.trim();

    const fetchFilteredTeams = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
        const params = new URLSearchParams();

        if (cleanSearch.length >= 2) {
          params.append("search", cleanSearch);
        }
        if (selectedCountry) {
          params.append("country", selectedCountry);
        }
        params.append("limit", "100");

        const res = await fetch(`${baseUrl}/api/teams?${params.toString()}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(
            json.error || "Error retrieving clubs from the server.",
          );
        }

        if (json.data && Array.isArray(json.data)) {
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
          "Connection error while retrieving teams from the backend.",
        );
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchFilteredTeams, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCountry, isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedTeam) return;
    localStorage.setItem("favorite_team", JSON.stringify(selectedTeam));
    window.dispatchEvent(new Event("favoriteTeamChanged"));
    onConfirm(selectedTeam);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#14171c] border border-edge/20 w-full max-w-xl p-6 md:p-8 space-y-6 relative shadow-2xl rounded-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand via-brand/50 to-transparent"></div>

        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold text-brand uppercase tracking-widest bg-brand/10 px-2.5 py-1 border border-brand/30 rounded-md">
              {isFirstTime ? "Initial Setup" : "Preferences"}
            </span>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mt-2">
              {isFirstTime ? "Select Your Main Club" : "Change Favorite Team"}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Search by name and filter by country to find your favorite club.
            </p>
          </div>

          {!isFirstTime && onClose && (
            <button
              onClick={onClose}
              type="button"
              className="text-gray-400 hover:text-white text-lg transition-colors cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search & Country Filter Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">
              Club Name
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. Flamengo, Real Madrid..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0d0f12] border border-edge/20 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand text-sm transition-all"
              />
            </div>
          </div>

          {/* Country Filter Select */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block">
              Country
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full bg-[#0d0f12] border border-edge/20 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-brand text-sm appearance-none transition-all cursor-pointer"
              >
                <option value="" className="bg-[#14171c] text-white">
                  All Countries
                </option>
                {availableCountries.map((country) => (
                  <option
                    key={country}
                    value={country}
                    className="bg-[#14171c] text-white"
                  >
                    {country}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
            {errorMessage}
          </div>
        )}

        {/* List of Results */}
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-brand font-semibold">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-brand border-t-transparent"></span>
              Querying database...
            </div>
          )}

          {!isLoading && searchResults.length === 0 && !errorMessage && (
            <p className="text-xs text-gray-400 text-center py-10">
              No clubs found matching your criteria.
            </p>
          )}

          {!isLoading &&
            searchResults.map((team) => {
              const isSelected = selectedTeam?.id === team.id;
              return (
                <div
                  key={team.id}
                  onClick={() => setSelectedTeam(team)}
                  className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-brand/10 border-brand text-white shadow-md"
                      : "bg-[#0d0f12]/50 border-edge/10 hover:border-brand/40 text-gray-300 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {team.badgeUrl ? (
                      <img
                        src={team.badgeUrl}
                        alt={team.name}
                        className="w-8 h-8 object-contain drop-shadow"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-surface-muted flex items-center justify-center">
                        <Shield className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-white">
                        {team.name}
                      </p>
                      {team.country && (
                        <p className="text-[10px] text-gray-400 font-medium">
                          {team.country}
                        </p>
                      )}
                    </div>
                  </div>

                  {isSelected && <CheckCircle className="w-5 h-5 text-brand" />}
                </div>
              );
            })}
        </div>

        {/* Confirmation Button */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedTeam}
          className="w-full py-3.5 bg-brand hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed text-brand-foreground text-xs font-black uppercase tracking-[0.2em] transition-all cursor-pointer shadow-lg shadow-brand/20 rounded-xl"
        >
          {selectedTeam
            ? `Confirm ${selectedTeam.name}`
            : "Select a Team First"}
        </button>
      </div>
    </div>
  );
}
