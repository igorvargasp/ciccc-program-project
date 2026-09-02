import React, { useState, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  Search,
  CheckCircle,
  X,
  Shield,
  ArrowUpDown,
  Trophy,
  ChevronDown,
} from "lucide-react";
import { listCompetitions } from "../../api/competitions";

export interface Team {
  id: string | number;
  name: string;
  badgeUrl?: string;
  crestUrl?: string;
  country?: string;
}

interface SelectFavoriteTeamModalProps {
  isOpen: boolean;
  isFirstTime?: boolean;
  currentTeam?: Team | null;
  onConfirm: (team: Team) => void;
  onClose?: () => void;
}

type SortOrder = "asc" | "desc";

export function SelectFavoriteTeamModal({
  isOpen,
  isFirstTime = false,
  currentTeam = null,
  onConfirm,
  onClose,
}: SelectFavoriteTeamModalProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompetitionId, setSelectedCompetitionId] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(currentTeam);
  const [searchResults, setSearchResults] = useState<Team[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isCompetitionOpen, setIsCompetitionOpen] = useState(false);
  const competitionRef = useRef<HTMLDivElement>(null);

  // Close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        competitionRef.current &&
        !competitionRef.current.contains(event.target as Node)
      ) {
        setIsCompetitionOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (currentTeam) {
      setSelectedTeam(currentTeam);
    }
  }, [currentTeam]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchCompetitions = async () => {
      try {
        const comps = await listCompetitions();
        if (Array.isArray(comps)) {
          setCompetitions(comps);
        }
      } catch (err) {
        console.error("Error fetching competitions:", err);
      }
    };
    fetchCompetitions();
  }, [isOpen]);

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
        if (selectedCompetitionId) {
          params.append("competitionId", selectedCompetitionId);
        }
        params.append("limit", "100");

        const res = await fetch(`${baseUrl}/api/teams?${params.toString()}`);
        const json = await res.json();

        if (!res.ok) {
          throw new Error(
            json.error ||
              t("errors.fetchTeams", "Error retrieving clubs from the server."),
          );
        }

        if (json.data && Array.isArray(json.data)) {
          const formattedTeams: Team[] = json.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            badgeUrl: item.crestUrl || item.badgeUrl || item.logo,
            crestUrl: item.crestUrl || item.badgeUrl || item.logo,
            country: item.country,
          }));

          setSearchResults(formattedTeams);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Error in the request:", err);
        setErrorMessage(
          t(
            "errors.connection",
            "Connection error while retrieving teams from the backend.",
          ),
        );
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchFilteredTeams, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedCompetitionId, isOpen, t]);

  const sortedSearchResults = useMemo(() => {
    return [...searchResults].sort((a, b) => {
      const comp = a.name.localeCompare(b.name);
      return sortOrder === "asc" ? comp : -comp;
    });
  }, [searchResults, sortOrder]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!selectedTeam) return;
    const record = {
      ...selectedTeam,
      ...(selectedCompetitionId
        ? { competitionId: selectedCompetitionId }
        : {}),
    };
    localStorage.setItem("favorite_team", JSON.stringify(record));
    window.dispatchEvent(new Event("favoriteTeamChanged"));

    // Toast Success
    toast.success(
      t("modal.toastSuccess", "Favorite team updated successfully!"),
    );

    onConfirm(selectedTeam);
  };

  const selectedCompObj = competitions.find(
    (c) => String(c.id) === String(selectedCompetitionId),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-surface border border-edge/25 w-full max-w-2xl p-6 md:p-8 space-y-5 relative shadow-2xl rounded-2xl overflow-visible text-foreground">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand via-brand/50 to-transparent rounded-t-2xl"></div>

        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[10px] font-bold text-brand uppercase tracking-widest bg-brand/10 px-2.5 py-1 border border-brand/30 rounded-md">
              {isFirstTime
                ? t("modal.initialSetup", "Initial Setup")
                : t("modal.preferences", "Preferences")}
            </span>
            <h2 className="text-2xl font-black uppercase tracking-tight mt-2 text-foreground">
              {isFirstTime
                ? t("modal.selectMainClub", "Select Your Main Club")
                : t("modal.changeFavoriteTeam", "Change Favorite Team")}
            </h2>
            <p className="text-xs text-muted mt-1">
              {t(
                "modal.subtitleSimple",
                "Search by name or filter by competition to find your favorite club.",
              )}
            </p>
          </div>

          {!isFirstTime && onClose && (
            <button
              onClick={onClose}
              type="button"
              className="text-muted hover:text-foreground text-lg transition-colors cursor-pointer p-1 rounded-lg hover:bg-surface-2"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted uppercase tracking-widest block">
              {t("modal.clubName", "Club Name")}
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder={t(
                  "modal.searchPlaceholder",
                  "e.g. Flamengo, Real Madrid...",
                )}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface-2 border border-edge/20 rounded-xl py-2.5 pl-10 pr-4 text-foreground placeholder-muted focus:outline-none focus:border-brand text-sm transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5 relative" ref={competitionRef}>
            <label className="text-[11px] font-bold text-muted uppercase tracking-widest block">
              {t("modal.competition", "Competition")}
            </label>
            <button
              type="button"
              onClick={() => setIsCompetitionOpen(!isCompetitionOpen)}
              className="w-full bg-surface-2 border border-edge/20 rounded-xl py-2.5 px-3.5 text-foreground focus:outline-none focus:border-brand text-sm flex items-center justify-between transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <Trophy className="w-4 h-4 text-muted shrink-0" />
                <span className="truncate">
                  {selectedCompObj
                    ? selectedCompObj.name
                    : t("modal.allCompetitions", "All Competitions")}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-muted shrink-0 transition-transform ${isCompetitionOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isCompetitionOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-surface border border-edge/30 rounded-xl shadow-xl z-50 max-h-52 overflow-y-auto custom-scrollbar p-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCompetitionId("");
                    setIsCompetitionOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                    !selectedCompetitionId
                      ? "bg-brand/10 text-brand font-bold"
                      : "text-muted hover:bg-surface-2 hover:text-foreground"
                  }`}
                >
                  {t("modal.allCompetitions", "All Competitions")}
                </button>
                {competitions.map((comp) => (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => {
                      setSelectedCompetitionId(comp.id);
                      setIsCompetitionOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer truncate ${
                      String(selectedCompetitionId) === String(comp.id)
                        ? "bg-brand/10 text-brand font-bold"
                        : "text-muted hover:bg-surface-2 hover:text-foreground"
                    }`}
                  >
                    {comp.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted">
            {t("modal.resultsCount", "{{count}} clubs found", {
              count: sortedSearchResults.length,
            })}
          </span>
          <button
            type="button"
            onClick={() =>
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
            className="flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground bg-surface-2 px-3 py-1.5 rounded-lg border border-edge/15 transition-all cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-brand" />
            {sortOrder === "asc"
              ? t("modal.sortAZ", "Order: A-Z")
              : t("modal.sortZA", "Order: Z-A")}
          </button>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
            {errorMessage}
          </div>
        )}

        {/* Result List */}
        <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-10 text-xs text-brand font-semibold">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-brand border-t-transparent"></span>
              {t("modal.querying", "Querying database...")}
            </div>
          )}

          {!isLoading && sortedSearchResults.length === 0 && !errorMessage && (
            <p className="text-xs text-muted text-center py-10">
              {t("modal.noResults", "No clubs found matching your criteria.")}
            </p>
          )}

          {!isLoading &&
            sortedSearchResults.map((team) => {
              const isSelected = selectedTeam?.id === team.id;
              return (
                <div
                  key={team.id}
                  onClick={() => setSelectedTeam(team)}
                  className={`flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-brand/10 border-brand text-foreground shadow-md"
                      : "bg-surface-2/50 border-edge/10 hover:border-brand/40 text-muted hover:text-foreground"
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
                        <Shield className="w-4 h-4 text-muted" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-foreground">
                        {team.name}
                      </p>
                      {team.country && (
                        <p className="text-[10px] text-muted font-medium">
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

        {/* Confirmations Button */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedTeam}
          className="w-full py-3.5 bg-brand hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed text-brand-foreground text-xs font-black uppercase tracking-[0.2em] transition-all cursor-pointer shadow-lg shadow-brand/20 rounded-xl"
        >
          {selectedTeam
            ? t("modal.confirmTeam", "Confirm {{name}}", {
                name: selectedTeam.name,
              })
            : t("modal.selectTeamFirst", "Select a Team First")}
        </button>
      </div>
    </div>
  );
}
