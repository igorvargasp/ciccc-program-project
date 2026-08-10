<<<<<<< HEAD
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowRight, Radio } from "lucide-react";
import { listMatches } from "../api/matches";
import { listNews } from "../api/news";
import MatchCard from "../components/MatchCard";
import NewsCard from "../components/NewsCard";
import { useTeamsMap } from "../hooks/useTeamsMap";
import { useNewsRealtime } from "../hooks/useRealtime";
import { SkeletonCard } from "@/components/ui/Skeleton";
import {
  SelectFavoriteTeamModal,
  Team,
} from "@/components/modals/SelectFavoriteTeamModal";

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
        {/* Left Side: Branding / Team Info */}
        <div className="space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand/10 border border-brand/30 text-brand text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-brand animate-pulse rounded-full"></span>
            {t("home.title", "Football Intelligence Hub")}
          </div>

          {selectedTeam ? (
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                {selectedTeam.badgeUrl ? (
                  <img
                    src={selectedTeam.badgeUrl}
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
                  <p className="text-sm text-muted font-medium">
                    {selectedTeam.country ||
                      t("common.unknown", "Professional Team")}
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

        {/* Right Side: Change Team Action Button */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={onOpenTeamModal}
            className="px-6 py-3.5 bg-brand hover:bg-brand/90 text-brand-foreground text-xs font-black uppercase tracking-[0.15em] transition-all duration-300 shadow-md hover:shadow-brand/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
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
=======
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Radio } from 'lucide-react';
import { listMatches } from '../api/matches';
import { listNews } from '../api/news';
import { listCompetitions } from '../api/competitions';
import MatchCard from '../components/MatchCard';
import NewsCard from '../components/NewsCard';
import { useTeamsMap } from '../hooks/useTeamsMap';
import { useNewsRealtime } from '../hooks/useRealtime';
import { SkeletonCard } from '../components/ui/Skeleton';
import { cn } from '../lib/utils';

const UPCOMING_PAGE_SIZE = 6;
>>>>>>> 667cbfd03bb4861ee4272c14f9bb22733685ade8

export default function Home() {
  const { t } = useTranslation();
  const teamsMap = useTeamsMap();
<<<<<<< HEAD
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Carrega o time favorito ao iniciar e escuta alterações
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
=======
  const [competitionId, setCompetitionId] = useState<string | undefined>(undefined);
  const [showAll, setShowAll] = useState(false);
>>>>>>> 667cbfd03bb4861ee4272c14f9bb22733685ade8

  // Subscribe to live news via Socket.IO
  useNewsRealtime();

  const { data: competitions } = useQuery({
    queryKey: ['competitions'],
    queryFn: listCompetitions,
    staleTime: 10 * 60_000,
  });

  const { data: liveMatches, isLoading: loadingLive } = useQuery({
    queryKey: ["matches", { status: "live" }],
    queryFn: () => listMatches({ status: "live", limit: 6 }),
    refetchInterval: 30_000,
  });

  const teamId = selectedTeam?.id;

  // Busca as partidas agendadas estritamente do time favorito
  const { data: upcomingMatches, isLoading: loadingUpcoming } = useQuery({
<<<<<<< HEAD
    queryKey: ["team-matches", teamId, "scheduled"],
    queryFn: async () => {
      if (!teamId) return [];
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(
        `${baseUrl}/api/teams/${teamId}/matches?status=scheduled`,
      );
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Error fetching team matches.");
      }
      return (json.data || json || []) as any[];
    },
    enabled: !!teamId,
=======
    queryKey: ['matches', { status: 'scheduled', competitionId }],
    queryFn: () => listMatches({ status: 'scheduled', competitionId, limit: 50 }),
>>>>>>> 667cbfd03bb4861ee4272c14f9bb22733685ade8
    staleTime: 60_000,
  });

  const { data: news, isLoading: loadingNews } = useQuery({
    queryKey: ["news"],
    queryFn: () => listNews({ limit: 9 }),
    staleTime: 60_000,
  });

  return (
    <div className="space-y-10">
      {/* ── Hero ── */}
      <HeroSection
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
        selectedTeam={selectedTeam}
      />

      {/* ── Live matches ── */}
      {(loadingLive || (liveMatches && liveMatches.length > 0)) && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-green-400 animate-live-dot" />
              <h2 className="text-lg font-extrabold text-foreground">
                {t("home.liveMatches")}
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {loadingLive
              ? Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))
              : liveMatches?.map((m) => {
                  const homeTeamObj =
                    typeof m.homeTeam === "object"
                      ? m.homeTeam
                      : teamsMap.get(m.homeTeamId) ||
                        teamsMap.get(String(m.homeTeamId)) ||
                        teamsMap.get(Number(m.homeTeamId));
                  const awayTeamObj =
                    typeof m.awayTeam === "object"
                      ? m.awayTeam
                      : teamsMap.get(m.awayTeamId) ||
                        teamsMap.get(String(m.awayTeamId)) ||
                        teamsMap.get(Number(m.awayTeamId));

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

      {/* ── Upcoming matches (Limitado a 6 com Botão Ver Mais) ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-foreground">
            {selectedTeam
              ? `${t("home.upcomingMatches", "Upcoming Matches")} - ${selectedTeam.name}`
              : t("home.upcomingMatches", "Upcoming Matches")}
          </h2>
          <Link
            to="/matches"
            className="flex items-center gap-1 text-sm text-brand font-semibold hover:underline"
          >
            {t("common.seeAll", "See all")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* League filter */}
        {competitions && competitions.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            <button
              onClick={() => { setCompetitionId(undefined); setShowAll(false); }}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                !competitionId
                  ? 'bg-brand text-white border-brand'
                  : 'bg-surface-2 text-muted border-edge/12 hover:text-foreground',
              )}
            >
              {t('common.all')}
            </button>
            {competitions.map((c) => (
              <button
                key={c.id}
                onClick={() => { setCompetitionId(c.id === competitionId ? undefined : c.id); setShowAll(false); }}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                  competitionId === c.id
                    ? 'bg-brand text-white border-brand'
                    : 'bg-surface-2 text-muted border-edge/12 hover:text-foreground',
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
<<<<<<< HEAD
          {loadingUpcoming ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : !teamId ? (
            <p className="text-muted text-sm col-span-full">
              {t(
                "matches.selectClubPrompt",
                "Select a favorite club to view matches.",
              )}
            </p>
          ) : upcomingMatches?.length ? (
            upcomingMatches.slice(0, 6).map((m) => {
              const homeTeamObj =
                typeof m.homeTeam === "object"
                  ? m.homeTeam
                  : teamsMap.get(m.homeTeamId) ||
                    teamsMap.get(String(m.homeTeamId)) ||
                    teamsMap.get(Number(m.homeTeamId));
              const awayTeamObj =
                typeof m.awayTeam === "object"
                  ? m.awayTeam
                  : teamsMap.get(m.awayTeamId) ||
                    teamsMap.get(String(m.awayTeamId)) ||
                    teamsMap.get(Number(m.awayTeamId));

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
              {t("common.noData")}
            </p>
          )}
=======
          {loadingUpcoming
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : upcomingMatches?.length
              ? (showAll ? upcomingMatches : upcomingMatches.slice(0, UPCOMING_PAGE_SIZE)).map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    homeTeam={teamsMap.get(m.homeTeamId)}
                    awayTeam={teamsMap.get(m.awayTeamId)}
                  />
                ))
              : <p className="text-muted text-sm col-span-full">{t('common.noData')}</p>}
>>>>>>> 667cbfd03bb4861ee4272c14f9bb22733685ade8
        </div>

        {/* Show more / show less */}
        {!loadingUpcoming && upcomingMatches && upcomingMatches.length > UPCOMING_PAGE_SIZE && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => setShowAll((v) => !v)}
              className="px-5 py-2 rounded-lg bg-surface-2 border border-edge/12 text-sm font-semibold text-muted hover:text-foreground transition-colors"
            >
              {showAll ? t('common.showLess') : t('common.showMore', { n: upcomingMatches.length - UPCOMING_PAGE_SIZE })}
            </button>
          </div>
        )}
      </section>

      {/* ── Latest news ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-foreground">
            {t("home.latestNews")}
          </h2>
          <Link
            to="/news"
            className="flex items-center gap-1 text-sm text-brand font-semibold hover:underline"
          >
            {t("common.seeAll")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loadingNews ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : news?.length ? (
            news.slice(0, 6).map((a) => <NewsCard key={a.id} article={a} />)
          ) : (
            <p className="text-muted text-sm col-span-full">
              {t("news.noNews")}
            </p>
          )}
        </div>
      </section>

      {/* Modal Real de Seleção de Time */}
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
