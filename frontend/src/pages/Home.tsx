import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Radio,
  Trophy,
  Users,
  User,
  Shield,
  Newspaper,
  ChevronRight,
} from "lucide-react";
import { listMatches } from "../api/matches";
import { listNews } from "../api/news";
import { listCompetitions } from "../api/competitions";
import { listTeams } from "../api/teams";
import { listPlayers } from "../api/players";

import MatchCard from "../components/MatchCard";
import NewsCard from "../components/NewsCard";
import { useTeamsMap } from "../hooks/useTeamsMap";
import { useNewsRealtime } from "../hooks/useRealtime";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { cn } from "../lib/utils";
import {
  SelectFavoriteTeamModal,
  Team,
} from "@/components/modals/SelectFavoriteTeamModal";
import type { MatchListItem, TeamRef, Team as TeamType } from "../types";

const UPCOMING_PAGE_SIZE = 6;

// Ordem exata desejada (em minúsculas para facilitar a comparação)
const COMPETITION_ORDER = [
  "bundesliga",
  "la liga",
  "campeonato brasileiro",
  "premier league",
  "eredivisie",
  "ligue 1",
  "serie a",
  "uefa champions league",
  "copa libertadores",
  "primeira liga",
  "major league soccer",
  "championship",
  "liga mx",
];

function resolveTeam(
  embedded: TeamRef | undefined,
  teamId: string | undefined,
  teamsMap: Map<string, TeamType>,
): TeamRef | undefined {
  if (embedded) return embedded;
  return teamId ? teamsMap.get(teamId) : undefined;
}

interface HeroSectionProps {
  onOpenTeamModal: () => void;
  selectedTeam: Team | null;
}

function HeroSection({ onOpenTeamModal, selectedTeam }: HeroSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="relative rounded-2xl overflow-hidden bg-surface border border-edge/12 p-6 md:p-10 shadow-lg">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-brand/10 blur-2xl" />
      </div>

      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/10 border border-brand/30 text-brand text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-brand animate-pulse rounded-full"></span>
            {t("home.title", "Football Intelligence Hub")}
          </div>

          {selectedTeam ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                {selectedTeam.badgeUrl || selectedTeam.crestUrl ? (
                  <img
                    src={selectedTeam.badgeUrl || selectedTeam.crestUrl}
                    alt={selectedTeam.name}
                    className="w-16 h-16 object-contain drop-shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-surface-muted flex items-center justify-center text-2xl font-black">
                    ⚽
                  </div>
                )}
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                    {selectedTeam.name}
                  </h1>
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedTeam?.country || "Professional Team"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-foreground mb-3 leading-tight">
                AliScore
              </h1>
              <p className="text-muted text-base md:text-lg max-w-lg">
                {t("home.subtitle")}
              </p>
            </div>
          )}
        </div>

        <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={onOpenTeamModal}
            className="px-6 py-3.5 bg-brand hover:bg-brand/90 text-brand-foreground text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 shadow-md hover:shadow-brand/25 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">
              swap_horiz
            </span>
            {selectedTeam
              ? t("settings.favoriteTeams", "Change Team")
              : t("settings.favoriteTeams", "Select Favorite Team")}
          </button>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const teamsMap = useTeamsMap();
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [competitionId, setCompetitionId] = useState<string | undefined>(
    undefined,
  );
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const loadFavoriteTeam = () => {
      const stored = localStorage.getItem("favorite_team");
      if (stored) {
        try {
          setSelectedTeam(JSON.parse(stored));
        } catch (e) {
          console.error("Error parsing favorite team", e);
          setSelectedTeam(null);
        }
      } else {
        setSelectedTeam(null);
      }
    };

    loadFavoriteTeam();
    window.addEventListener("favoriteTeamChanged", loadFavoriteTeam);
    return () => {
      window.removeEventListener("favoriteTeamChanged", loadFavoriteTeam);
    };
  }, []);

  useNewsRealtime();

  const { data: competitions } = useQuery({
    queryKey: ["competitions"],
    queryFn: async () => {
      const data = await listCompetitions();
      if (!data) return [];

      return [...data].sort((a, b) => {
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();

        const indexA = COMPETITION_ORDER.findIndex((ordem) =>
          nameA.includes(ordem),
        );
        const indexB = COMPETITION_ORDER.findIndex((ordem) =>
          nameB.includes(ordem),
        );

        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;

        return nameA.localeCompare(nameB);
      });
    },
    staleTime: 10 * 60_000,
  });

  const { data: liveMatches, isLoading: loadingLive } = useQuery({
    queryKey: ["matches", { status: "live" }],
    queryFn: (): Promise<MatchListItem[]> =>
      listMatches({ status: "live", limit: 6 }),
    refetchInterval: 30_000,
  });

  const { data: upcomingMatches, isLoading: loadingUpcoming } = useQuery({
    queryKey: ["upcoming-matches", { competitionId }],
    queryFn: (): Promise<MatchListItem[]> =>
      listMatches({ status: "scheduled", competitionId, limit: 50 }),
    staleTime: 60_000,
  });

  const { data: news, isLoading: loadingNews } = useQuery({
    queryKey: ["news"],
    queryFn: () => listNews({ limit: 6 }),
    staleTime: 60_000,
  });

  const { data: teams } = useQuery({
    queryKey: ["teams-preview"],
    queryFn: () => (listTeams ? listTeams({ limit: 6 }) : Promise.resolve([])),
    staleTime: 5 * 60_000,
  });

  return (
    <div className="space-y-10">
      <HeroSection
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
        selectedTeam={selectedTeam}
      />

      {/* Partidas Ao Vivo */}
      {(loadingLive || (liveMatches && liveMatches.length > 0)) && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-green-400 animate-live-dot" />
              <h2 className="text-lg font-extrabold text-foreground">
                {t("home.liveMatches", "Live Matches")}
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {loadingLive
              ? Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              : liveMatches?.map((m) => {
                  const homeTeamObj = resolveTeam(
                    m.homeTeam,
                    m.homeTeamId,
                    teamsMap,
                  );
                  const awayTeamObj = resolveTeam(
                    m.awayTeam,
                    m.awayTeamId,
                    teamsMap,
                  );

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
        </section>
      )}

      {/* Partidas Agendadas */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-foreground">
            {t("home.upcomingMatches", "Upcoming Matches")}
          </h2>
          <Link
            to="/matches"
            className="flex items-center gap-1 text-sm text-brand font-semibold hover:underline"
          >
            {t("common.seeAll", "See all")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {competitions && competitions.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            <button
              onClick={() => {
                setCompetitionId(undefined);
                setShowAll(false);
              }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer",
                !competitionId
                  ? "bg-brand text-white border-brand"
                  : "bg-surface-2 text-muted border-edge/12 hover:text-foreground",
              )}
            >
              {t("common.all", "All")}
            </button>
            {competitions.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCompetitionId(c.id === competitionId ? undefined : c.id);
                  setShowAll(false);
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer",
                  competitionId === c.id
                    ? "bg-brand text-white border-brand"
                    : "bg-surface-2 text-muted border-edge/12 hover:text-foreground",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loadingUpcoming ? (
            Array.from({ length: UPCOMING_PAGE_SIZE }).map((_, i) => (
              <SkeletonCard key={i} />
            ))
          ) : upcomingMatches?.length ? (
            (showAll
              ? upcomingMatches
              : upcomingMatches.slice(0, UPCOMING_PAGE_SIZE)
            ).map((m) => {
              const homeTeamObj = resolveTeam(
                m.homeTeam,
                m.homeTeamId,
                teamsMap,
              );
              const awayTeamObj = resolveTeam(
                m.awayTeam,
                m.awayTeamId,
                teamsMap,
              );

              return (
                <MatchCard
                  key={m.id}
                  match={m}
                  homeTeam={homeTeamObj}
                  awayTeam={awayTeamObj}
                />
              );
            })
          ) : (
            <p className="text-muted text-sm col-span-full">
              {t("common.noData", "No matches found")}
            </p>
          )}
        </div>
      </section>

      {/* 1. Competitions Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-extrabold text-foreground">
              {t("competitions.title", "Competitions")}
            </h2>
          </div>
          <Link
            to="/competitions"
            className="flex items-center gap-1 text-sm text-brand font-semibold hover:underline"
          >
            {t("common.seeAll", "See all")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {competitions?.slice(0, 6).map((comp: any) => {
            const compLogo =
              comp.logoUrl ||
              comp.logo ||
              comp.emblem ||
              comp.badge ||
              comp.crest ||
              comp.flag;

            return (
              <Link
                key={comp.id}
                to={`/competitions/${comp.id}`}
                className="p-4 rounded-xl bg-surface border border-edge/12 hover:border-brand/50 transition-all flex flex-col items-center text-center gap-2"
              >
                {compLogo ? (
                  <img
                    src={compLogo}
                    alt={comp.name}
                    className="w-10 h-10 object-contain"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold">
                    🏆
                  </div>
                )}
                <span className="text-xs font-bold text-foreground truncate w-full">
                  {comp.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 2. Teams Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-extrabold text-foreground">
              {t("teams.title", "Teams")}
            </h2>
          </div>
          <Link
            to="/teams"
            className="flex items-center gap-1 text-sm text-brand font-semibold hover:underline"
          >
            {t("common.seeAll", "See all")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {teams?.slice(0, 6).map((team: any) => (
            <Link
              key={team.id}
              to={`/teams/${team.id}`}
              className="p-4 rounded-xl bg-surface border border-edge/12 hover:border-brand/50 transition-all flex flex-col items-center text-center gap-2"
            >
              {team.badgeUrl || team.crestUrl ? (
                <img
                  src={team.badgeUrl || team.crestUrl}
                  alt={team.name}
                  className="w-10 h-10 object-contain"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold">
                  ⚽
                </div>
              )}
              <span className="text-xs font-bold text-foreground truncate w-full">
                {team.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Players Section (Banner Interativo) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-extrabold text-foreground">
              {t("nav.players", "Players")}
            </h2>
          </div>
          <Link
            to="/players"
            className="flex items-center gap-1 text-sm text-brand font-semibold hover:underline"
          >
            {t("common.seeAll", "See all")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <Link to="/players" className="block group">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0b253b] via-[#081a2b] to-[#040f1a] border border-blue-500/30 rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:border-blue-400/60 hover:shadow-xl hover:shadow-blue-950/40">
            <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-end pr-10">
              <User className="w-64 h-64 text-white" />
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase">
                  <User className="w-3.5 h-3.5" />
                  <span>
                    {t("home.playersBanner.tag", "Database de Atletas")}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {t(
                    "home.playersBanner.title",
                    "Explore estatísticas detalhadas de jogadores",
                  )}
                </h3>
                <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed font-medium">
                  {t(
                    "home.playersBanner.subtitle",
                    "Acesse perfis completos, histórico de atuações, gols, assistências e dados de performance dos maiores craques do futebol mundial.",
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 bg-blue-500 text-white font-black text-xs sm:text-sm px-5 py-3 rounded-xl transition-all duration-200 group-hover:bg-blue-400 group-hover:scale-105 shadow-lg shrink-0">
                <span>{t("home.playersBanner.action", "Ver Jogadores")}</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* 4. Lineups Section (Banner Miniatura do Campo) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-extrabold text-foreground">
              {t("nav.lineup", "Lineups & Táticas")}
            </h2>
          </div>
          <Link
            to="/lineups"
            className="flex items-center gap-1 text-sm text-brand font-semibold hover:underline"
          >
            {t("common.seeAll", "See all")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <Link to="/lineups" className="block group">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0b3b2c] via-[#09261c] to-[#05140e] border border-emerald-500/30 rounded-2xl p-6 sm:p-8 transition-all duration-300 hover:border-emerald-400/60 hover:shadow-xl hover:shadow-emerald-950/40">
            <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
              <div className="w-80 h-80 rounded-full border-2 border-white/40 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full border-2 border-white/40" />
              </div>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase">
                  <Shield className="w-3.5 h-3.5" />
                  <span>{t("home.lineupsBanner.tag", "Squad Builder")}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {t(
                    "home.lineupsBanner.title",
                    "Monte sua formação tática personalizada",
                  )}
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed font-medium">
                  {t(
                    "home.lineupsBanner.subtitle",
                    "Crie sua escalação dos sonhos, combinando estrelas do seu time do coração ou reunindo os maiores craques do futebol mundial em uma única equipe.",
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2 bg-emerald-500 text-black font-black text-xs sm:text-sm px-5 py-3 rounded-xl transition-all duration-200 group-hover:bg-emerald-400 group-hover:scale-105 shadow-lg shrink-0">
                <span>{t("home.lineupsBanner.action", "Criar Meu Time")}</span>
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* 5. News Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-extrabold text-foreground">
              {t("home.latestNews", "Latest News")}
            </h2>
          </div>
          <Link
            to="/news"
            className="flex items-center gap-1 text-sm text-brand font-semibold hover:underline"
          >
            {t("common.seeAll", "See all")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingNews ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : news?.length ? (
            news.slice(0, 6).map((a) => <NewsCard key={a.id} article={a} />)
          ) : (
            <p className="text-muted text-sm col-span-full">
              {t("news.noNews", "No news found")}
            </p>
          )}
        </div>
      </section>

      <SelectFavoriteTeamModal
        isOpen={isTeamModalOpen}
        isFirstTime={false}
        currentTeam={selectedTeam}
        onConfirm={(team) => {
          setSelectedTeam(team);
          setIsTeamModalOpen(false);
        }}
        onClose={() => setIsTeamModalOpen(false)}
      />
    </div>
  );
}
