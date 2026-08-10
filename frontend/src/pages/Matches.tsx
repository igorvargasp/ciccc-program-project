import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import MatchCard from "@/components/MatchCard";
import { SkeletonCard } from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { Calendar } from "lucide-react";
import { useTeamsMap } from "@/hooks/useTeamsMap";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

type StatusFilter = "live" | "scheduled" | "finished";

const TABS: { key: StatusFilter; label: string }[] = [
  { key: "live", label: "matches.live" },
  { key: "scheduled", label: "matches.upcoming" },
  { key: "finished", label: "matches.finished" },
];

export default function Matches() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [status, setStatus] = useState<StatusFilter>("scheduled");
  const teamsMap = useTeamsMap();

  // Estado para armazenar o time favorito atual (lido do localStorage ou do contexto)
  const [favoriteTeam, setFavoriteTeam] = useState<{
    id: string | number;
    name: string;
  } | null>(() => {
    const saved = localStorage.getItem("favorite_team");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  // Ouve eventos de mudança de time favorito para atualizar o estado em tempo real
  useEffect(() => {
    const handleFavoriteChange = () => {
      const saved = localStorage.getItem("favorite_team");
      if (saved) {
        try {
          setFavoriteTeam(JSON.parse(saved));
        } catch {
          setFavoriteTeam(null);
        }
      } else {
        setFavoriteTeam(null);
      }
    };

    window.addEventListener("favoriteTeamChanged", handleFavoriteChange);
    return () => {
      window.removeEventListener("favoriteTeamChanged", handleFavoriteChange);
    };
  }, []);

  const selectedTeamId = favoriteTeam?.id || user?.favoriteTeamId;

  // Busca as partidas baseadas exclusivamente no time favorito selecionado
  const { data: matches, isLoading } = useQuery({
    queryKey: ["team-matches", selectedTeamId, status],
    queryFn: async () => {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(
        `${baseUrl}/api/teams/${selectedTeamId}/matches?status=${status}`,
      );
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Error fetching matches.");
      }

      return (json.data || json || []) as any[];
    },
    enabled: !!selectedTeamId,
    refetchInterval: status === "live" ? 30_000 : undefined,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">
            {t("matches.title", "Matches and Schedule")}
          </h1>
          {favoriteTeam && (
            <p className="text-xs text-[#00d2fd] font-bold uppercase tracking-wider mt-1">
              Showing matches for: {favoriteTeam.name}
            </p>
          )}
        </div>
      </div>

      {/* Se nenhum time favorito estiver selecionado */}
      {!selectedTeamId ? (
        <div className="bg-[#14171c] border border-[#414755]/30 p-12 text-center text-xs text-[#8b90a0] uppercase tracking-wider rounded-xl space-y-3">
          <p>
            {t(
              "matches.selectClubPrompt",
              "Select a favorite club in your preferences to view the matches.",
            )}
          </p>
        </div>
      ) : (
        <div className="bg-[#14171c] border border-[#414755]/30 p-6 space-y-4 rounded-xl">
          {/* Header & Status Tabs */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#414755]/30 pb-3">
            <h3 className="text-xs font-black text-[#00d2fd] uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">event</span>
              {t("matches.scheduleTitle", "Telemetry Schedule")}
            </h3>

            {/* Status Tabs */}
            <div className="flex gap-1 bg-surface-2 rounded-xl p-1 w-fit">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setStatus(key)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                    status === key
                      ? "bg-[#00d2fd] text-black"
                      : "text-[#8b90a0] hover:text-foreground",
                  )}
                >
                  {key === "live" && status === "live" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                  )}
                  {t(label, key)}
                </button>
              ))}
            </div>
          </div>

          {/* Matches Content Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : !matches?.length ? (
            <EmptyState
              icon={<Calendar className="w-10 h-10 text-[#8b90a0]" />}
              title={t("matches.noMatches", "No matches found.")}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {matches.map((m) => {
                const homeTeamObj =
                  typeof m.homeTeam === "object"
                    ? m.homeTeam
                    : teamsMap.get(m.homeTeamId);
                const awayTeamObj =
                  typeof m.awayTeam === "object"
                    ? m.awayTeam
                    : teamsMap.get(m.awayTeamId);

                return (
                  <MatchCard
                    key={m.id}
                    match={m}
                    homeTeam={homeTeamObj}
                    awayTeam={awayTeamObj}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
