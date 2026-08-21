import { useState, useEffect } from "react";
import {
  Search,
  X,
  Shield,
  Globe2,
  ArrowDownAZ,
  ArrowUpAZ,
  Filter,
  Building2,
} from "lucide-react";
import type { LineupSlotPlayer as Player } from "@/types";
import { useTranslation } from "react-i18next";

const POSITIONS = ["GK", "DEF", "MID", "FWD"];

const getCategory = (pos: string) => {
  const map: Record<string, string> = {
    LB: "DEF",
    CB: "DEF",
    RB: "DEF",
    LWB: "DEF",
    RWB: "DEF",
    CDM: "MID",
    CM: "MID",
    LM: "MID",
    RM: "MID",
    CAM: "MID",
    LW: "FWD",
    RW: "FWD",
    ST: "FWD",
    CF: "FWD",
  };
  return map[pos] || pos;
};

interface Team {
  id: string | number;
  name: string;
}

interface PlayerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPlayer: (player: Player) => void;
  positionFilter?: string;
  excludePlayerIds?: (string | number)[];
}

export default function PlayerSearchModal({
  isOpen,
  onClose,
  onSelectPlayer,
  positionFilter,
  excludePlayerIds = [],
}: PlayerSearchModalProps) {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<"my-team" | "global">("my-team");
  const [searchTerm, setSearchTerm] = useState("");

  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [teamResults, setTeamResults] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);

  const [selectedPosition, setSelectedPosition] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [favoriteTeamId, setFavoriteTeamId] = useState<string | null>(null);
  const [favoriteTeamName, setFavoriteTeamName] = useState<string>("My Team");

  useEffect(() => {
    setSearchTerm("");
    setTeamSearchQuery("");
    setSelectedTeam(null);
    setTeamResults([]);
    setShowTeamDropdown(false);
  }, [activeTab]);

  useEffect(() => {
    if (isOpen && positionFilter) {
      setSelectedPosition(getCategory(positionFilter));
    }
  }, [isOpen, positionFilter]);

  useEffect(() => {
    if (!isOpen) return;
    const savedFav = localStorage.getItem("favorite_team");
    if (savedFav) {
      try {
        const parsed = JSON.parse(savedFav);
        setFavoriteTeamId(parsed.id || parsed.team?.id);
        setFavoriteTeamName(parsed.name || parsed.team?.name || "My Team");
      } catch (e) {
        console.error(e);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeTab !== "global" || teamSearchQuery.length < 2 || selectedTeam) {
      setTeamResults([]);
      setShowTeamDropdown(false);
      return;
    }

    const fetchTeams = async () => {
      setLoadingTeams(true);
      try {
        const response = await fetch(
          `/api/teams?search=${encodeURIComponent(teamSearchQuery)}`,
        );
        const result = await response.json();
        const teamsData = result.data || result || [];
        setTeamResults(teamsData);
        setShowTeamDropdown(true);
      } catch (error) {
        console.error("Erro ao buscar times:", error);
      } finally {
        setLoadingTeams(false);
      }
    };

    const delay = setTimeout(fetchTeams, 300);
    return () => clearTimeout(delay);
  }, [teamSearchQuery, activeTab, selectedTeam]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchPlayers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append("search", searchTerm);
        if (selectedPosition) params.append("position", selectedPosition);

        if (activeTab === "my-team" && favoriteTeamId) {
          params.append("teamId", String(favoriteTeamId));
        } else if (activeTab === "global") {
          if (selectedTeam) {
            params.append("teamId", String(selectedTeam.id));
          } else if (teamSearchQuery) {
            params.append("teamName", teamSearchQuery);
          }
        }

        params.append("limit", "50");
        const response = await fetch(`/api/players?${params.toString()}`);
        const result = await response.json();

        let data = result.data || [];
        data.sort((a: Player, b: Player) => {
          return sortOrder === "asc"
            ? a.fullName.localeCompare(b.fullName)
            : b.fullName.localeCompare(a.fullName);
        });

        setPlayers(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    const delay = setTimeout(fetchPlayers, 300);
    return () => clearTimeout(delay);
  }, [
    searchTerm,
    teamSearchQuery,
    selectedTeam,
    isOpen,
    selectedPosition,
    sortOrder,
    activeTab,
    favoriteTeamId,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-[#14171c] border border-[#414755]/40 rounded-xl w-full max-w-lg shadow-2xl flex flex-col h-[90vh] sm:max-h-[85vh]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-4 border-b border-[#414755]/30">
          <h3 className="text-xs font-black text-[#00d2fd] uppercase tracking-[0.2em]">
            {t("lineup.clickToAdd") || "Select Player"}
          </h3>
          <button
            onClick={onClose}
            className="text-[#8b90a0] hover:text-white cursor-pointer p-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas (My Team / Global Market) */}
        <div className="px-4 pt-3">
          <div className="flex bg-[#0d0f12] p-1 rounded-lg border border-[#414755]/30">
            <button
              onClick={() => setActiveTab("my-team")}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 text-[11px] sm:text-xs font-bold rounded-md transition-all cursor-pointer truncate ${
                activeTab === "my-team"
                  ? "bg-[#00d2fd]/20 text-[#00d2fd] border border-[#00d2fd]/50"
                  : "text-[#8b90a0] hover:text-white"
              }`}
            >
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{favoriteTeamName}</span>
            </button>
            <button
              onClick={() => setActiveTab("global")}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 text-[11px] sm:text-xs font-bold rounded-md transition-all cursor-pointer truncate ${
                activeTab === "global"
                  ? "bg-[#00d2fd]/20 text-[#00d2fd] border border-[#00d2fd]/50"
                  : "text-[#8b90a0] hover:text-white"
              }`}
            >
              <Globe2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {t("market.globalMarket") || "Global Market"}
              </span>
            </button>
          </div>
        </div>

        {/* Filtros e Buscas */}
        <div className="p-4 border-b border-[#414755]/30 space-y-3 relative">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#8b90a0]" />
            <input
              placeholder={
                t("players.searchPlaceholder") || "Search player name..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0d0f12] border border-[#414755]/40 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#00d2fd]"
            />
          </div>

          {activeTab === "global" && (
            <div className="relative">
              <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-[#8b90a0]" />
              {selectedTeam ? (
                <div className="flex items-center justify-between w-full bg-[#0d0f12] border border-[#00d2fd] rounded-lg pl-9 pr-3 py-2">
                  <span className="text-xs font-bold text-white truncate">
                    Team: {selectedTeam.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTeam(null);
                      setTeamSearchQuery("");
                    }}
                    className="text-[#00d2fd] hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <input
                  placeholder={
                    t("market.searchTeamPlaceholder") ||
                    "Search and select a team worldwide..."
                  }
                  value={teamSearchQuery}
                  onChange={(e) => {
                    setTeamSearchQuery(e.target.value);
                    if (!showTeamDropdown) setShowTeamDropdown(true);
                  }}
                  className="w-full bg-[#0d0f12] border border-[#414755]/40 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#00d2fd]"
                />
              )}

              {showTeamDropdown &&
                !selectedTeam &&
                teamSearchQuery.length >= 2 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#14171c] border border-[#414755] rounded-lg shadow-2xl z-20 max-h-40 overflow-y-auto">
                    {loadingTeams ? (
                      <div className="p-3 text-center text-xs text-[#8b90a0]">
                        Searching teams...
                      </div>
                    ) : teamResults.length === 0 ? (
                      <div className="p-3 text-center text-xs text-[#8b90a0]">
                        No teams found
                      </div>
                    ) : (
                      teamResults.map((team) => (
                        <div
                          key={team.id}
                          onClick={() => {
                            setSelectedTeam(team);
                            setShowTeamDropdown(false);
                            setTeamSearchQuery("");
                          }}
                          className="px-3 py-2 text-xs font-bold text-white hover:bg-[#00d2fd]/20 hover:text-[#00d2fd] cursor-pointer transition-colors border-b border-[#414755]/20 last:border-none"
                        >
                          {team.name}
                        </div>
                      ))
                    )}
                  </div>
                )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1.5 bg-[#0d0f12] border border-[#414755]/40 rounded-lg px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-[#8b90a0]" />
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-[#14171c]">
                  {t("players.allPositions") || "All Categories"}
                </option>
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos} className="bg-[#14171c]">
                    {t(`positions.${pos}`) || pos}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() =>
                setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
              className="flex items-center gap-1.5 bg-[#0d0f12] border border-[#414755]/40 hover:border-[#00d2fd] px-3 py-2 rounded-lg text-xs font-bold text-white cursor-pointer transition-colors"
              aria-label="Sort order"
            >
              {sortOrder === "asc" ? (
                <ArrowDownAZ className="w-4 h-4 text-[#00d2fd]" />
              ) : (
                <ArrowUpAZ className="w-4 h-4 text-[#00d2fd]" />
              )}
            </button>
          </div>
        </div>

        {/* Lista de Jogadores */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <p className="text-center text-xs text-[#8b90a0] py-6">
              {t("common.loading") || "Loading players..."}
            </p>
          ) : players.length === 0 ? (
            <p className="text-center text-xs text-[#8b90a0] py-6">
              {t("players.noPlayers") || "No players found matching criteria."}
            </p>
          ) : (
            players.map((player) => {
              const isAlreadySelected = excludePlayerIds.includes(player.id);
              const translatedPos =
                t(`positions.${player.position}`) || player.position;

              return (
                <div
                  key={player.id}
                  onClick={() => {
                    if (!isAlreadySelected) {
                      onSelectPlayer(player);
                    }
                  }}
                  className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                    isAlreadySelected
                      ? "bg-[#0d0f12]/50 border-[#414755]/10 opacity-40 cursor-not-allowed"
                      : "bg-[#0d0f12] border-[#414755]/20 hover:border-[#00d2fd] cursor-pointer group"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-[#14171c] border border-[#414755]/40 flex items-center justify-center overflow-hidden shrink-0">
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
                    <h4
                      className={`text-xs font-bold truncate transition-colors ${
                        isAlreadySelected
                          ? "text-[#8b90a0]"
                          : "text-white group-hover:text-[#00d2fd]"
                      }`}
                    >
                      {player.fullName}
                    </h4>
                    <p className="text-[10px] text-[#00d2fd] font-bold truncate">
                      {translatedPos}{" "}
                      {player.teamName ? `• ${player.teamName}` : ""}
                    </p>
                  </div>
                  {isAlreadySelected && (
                    <span className="text-[9px] font-bold uppercase bg-[#414755]/20 text-[#8b90a0] px-2 py-1 rounded shrink-0">
                      {t("lineup.sub") === "Reserva"
                        ? "Já escalado"
                        : "Selected"}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
