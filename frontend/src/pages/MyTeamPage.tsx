import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTeamsMap } from "@/hooks/useTeamsMap";
import { useAuth } from "@/context/AuthContext";
import {
  Star,
  Calendar,
  Users,
  UserCheck,
  Newspaper,
  Trophy,
  ChevronRight,
  Radio,
  ExternalLink,
  Activity,
  Globe,
  Table,
  Landmark,
} from "lucide-react";

export default function MyTeamPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const teamsMap = useTeamsMap();

  const [favoriteTeam, setFavoriteTeam] = useState<{
    id: string | number;
    name: string;
    logo?: string;
    crest?: string;
    crestUrl?: string;
    competitionId?: string | number;
    venue?: string;
    stadium?: string;
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
  const teamObj = selectedTeamId ? teamsMap.get(String(selectedTeamId)) : null;

  const teamName = favoriteTeam?.name || (teamObj as any)?.name || "My Team";

  const teamLogo =
    favoriteTeam?.logo ||
    favoriteTeam?.crest ||
    favoriteTeam?.crestUrl ||
    (teamObj as any)?.crest ||
    (teamObj as any)?.crestUrl ||
    (teamObj as any)?.logo;

  const teamCountry =
    (teamObj as any)?.country || (teamObj as any)?.area?.name || "Global";

  const teamVenue =
    favoriteTeam?.venue ||
    favoriteTeam?.stadium ||
    (teamObj as any)?.venue ||
    (teamObj as any)?.stadium ||
    (teamObj as any)?.ground ||
    (teamObj as any)?.location ||
    "Main Stadium";

  const { data: teamMatches, isLoading: loadingMatches } = useQuery({
    queryKey: ["page-team-matches", selectedTeamId],
    queryFn: async () => {
      if (!selectedTeamId) return [];
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${baseUrl}/api/teams/${selectedTeamId}/matches`);
      const json = await res.json();
      return json.data || json || [];
    },
    enabled: !!selectedTeamId,
    staleTime: 5 * 60_000,
  });

  const { data: teamPlayers } = useQuery({
    queryKey: ["page-team-players", selectedTeamId],
    queryFn: async () => {
      if (!selectedTeamId) return [];
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${baseUrl}/api/teams/${selectedTeamId}/players`);
      const json = await res.json();
      return json.data || json?.squad || json || [];
    },
    enabled: !!selectedTeamId,
    staleTime: 10 * 60_000,
  });

  const { data: teamStandings } = useQuery({
    queryKey: ["page-team-standings", selectedTeamId],
    queryFn: async () => {
      if (!selectedTeamId) return [];
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(
        `${baseUrl}/api/teams/${selectedTeamId}/standings`,
      );
      const json = await res.json();
      return json.data || json || [];
    },
    enabled: !!selectedTeamId,
    staleTime: 10 * 60_000,
  });

  const { data: teamNews } = useQuery({
    queryKey: ["page-team-news", selectedTeamId],
    queryFn: async () => {
      if (!selectedTeamId) return [];
      const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const res = await fetch(`${baseUrl}/api/teams/${selectedTeamId}/news`);
      const json = await res.json();
      return json.data || json || [];
    },
    enabled: !!selectedTeamId,
    staleTime: 10 * 60_000,
  });

  if (!selectedTeamId) {
    return (
      <div className="p-6 max-w-2xl mx-auto mt-12">
        <div className="bg-surface border border-edge/30 rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <Star className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-black uppercase tracking-wider text-foreground">
              My Team
            </h2>
            <p className="text-sm text-muted">
              Select your favorite team to unlock the exclusive dashboard.
            </p>
          </div>
          <button
            onClick={() => navigate("/teams")}
            className="px-5 py-2.5 rounded-xl bg-brand text-white font-medium text-sm hover:opacity-95 transition-all shadow-md"
          >
            Explore Teams
          </button>
        </div>
      </div>
    );
  }

  const liveMatch = Array.isArray(teamMatches)
    ? teamMatches.find(
        (m: any) =>
          m.status === "live" ||
          m.status === "IN_PLAY" ||
          m.status === "PAUSED",
      )
    : null;

  const nextMatch = Array.isArray(teamMatches)
    ? teamMatches.find(
        (m: any) =>
          m.status === "scheduled" ||
          m.status === "TIMED" ||
          m.status === "UPCOMING",
      )
    : null;

  const displayMatch = liveMatch || nextMatch;

  const homeId = displayMatch?.homeTeamId || displayMatch?.homeTeam?.id;
  const awayId = displayMatch?.awayTeamId || displayMatch?.awayTeam?.id;

  const homeTeamFromMap = homeId ? teamsMap.get(homeId) : null;
  const awayTeamFromMap = awayId ? teamsMap.get(awayId) : null;

  const homeName =
    displayMatch?.homeTeam?.name || (homeTeamFromMap as any)?.name || "Home";

  const awayName =
    displayMatch?.awayTeam?.name || (awayTeamFromMap as any)?.name || "Away";

  const homeCrest =
    displayMatch?.homeTeam?.crest ||
    displayMatch?.homeTeam?.crestUrl ||
    displayMatch?.homeTeam?.logo ||
    (homeTeamFromMap as any)?.crest ||
    (homeTeamFromMap as any)?.crestUrl ||
    (homeTeamFromMap as any)?.logo;

  const awayCrest =
    displayMatch?.awayTeam?.crest ||
    displayMatch?.awayTeam?.crestUrl ||
    displayMatch?.awayTeam?.logo ||
    (awayTeamFromMap as any)?.crest ||
    (awayTeamFromMap as any)?.crestUrl ||
    (awayTeamFromMap as any)?.logo;

  // Our API names this `kickoffAt`; `utcDate` is football-data.org's spelling
  // and never arrives, which is why no date was rendering.
  const kickoffRaw = displayMatch?.kickoffAt || displayMatch?.utcDate;
  const kickoff = kickoffRaw ? new Date(kickoffRaw) : null;

  const competitionName =
    displayMatch?.competition?.name || displayMatch?.competitionName || null;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* 1. Main Team Header */}
      <div className="bg-gradient-to-r from-surface to-surface-2 border border-edge/30 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {teamLogo ? (
            <img
              src={teamLogo}
              alt={teamName}
              className="w-16 h-16 object-contain drop-shadow-md bg-white/5 p-2 rounded-2xl border border-edge/20"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand font-black text-2xl">
              {teamName.charAt(0)}
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-brand uppercase tracking-widest">
                Official Dashboard
              </span>
              <span className="text-xs text-muted">•</span>
              <span className="text-xs font-medium text-muted flex items-center gap-1">
                <Globe className="w-3 h-3" /> {teamCountry}
              </span>
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              {teamName}
            </h1>
            <p className="text-xs text-muted flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5 text-amber-400" /> Stadium:{" "}
              {teamVenue}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-edge/10">
          <button
            onClick={() => navigate(`/teams/${selectedTeamId}`)}
            className="px-4 py-2 rounded-xl bg-brand text-white font-medium text-xs hover:opacity-95 transition-all shadow-md flex items-center gap-2"
          >
            View Full Profile <ExternalLink className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400">
              Favorite
            </span>
          </div>
        </div>
      </div>

      {/* 2. Highlighted Information Grid */}
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted px-1">
        Upcoming Matches
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div
          onClick={() => navigate("/matches")}
          className="group lg:col-span-2 bg-gradient-to-br from-surface to-surface-2 hover:border-brand/40 border border-edge/30 rounded-2xl p-6 transition-all cursor-pointer flex flex-col justify-between shadow-xl space-y-4"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-foreground flex items-center gap-2">
              {liveMatch ? (
                <Radio className="w-4 h-4 text-red-500 animate-pulse" />
              ) : (
                <Calendar className="w-4 h-4 text-brand" />
              )}
              {liveMatch ? "Live Match Now" : "Next Match"}
            </span>
            <span className="text-muted group-hover:text-brand flex items-center gap-1 text-xs transition-colors">
              View full table <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {loadingMatches ? (
            <div className="py-6 text-center text-sm text-muted animate-pulse">
              Loading match information...
            </div>
          ) : displayMatch ? (
            <div className="bg-surface-2/60 border border-edge/20 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 justify-end text-right">
                <span className="text-sm font-bold text-foreground">
                  {homeName}
                </span>
                {homeCrest ? (
                  <img
                    src={homeCrest}
                    alt={homeName}
                    className="w-10 h-10 object-contain drop-shadow"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center font-bold text-xs text-muted">
                    {homeName.slice(0, 3).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="px-4 py-2 bg-surface border border-edge/30 rounded-lg text-center mx-4">
                <span className="text-xs font-black text-brand tracking-widest block">
                  {liveMatch ? "LIVE" : "VS"}
                </span>
                <span className="text-xs font-semibold text-muted">
                  {kickoff ? kickoff.toLocaleDateString() : "Coming soon"}
                </span>
                {competitionName && (
                  <span className="text-[10px] text-muted block mt-0.5 max-w-[140px] truncate">
                    {competitionName}
                    {displayMatch.matchday ? ` · R${displayMatch.matchday}` : ""}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 flex-1 text-left">
                {awayCrest ? (
                  <img
                    src={awayCrest}
                    alt={awayName}
                    className="w-10 h-10 object-contain drop-shadow"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center font-bold text-xs text-muted">
                    {awayName.slice(0, 3).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-bold text-foreground">
                  {awayName}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-surface-2/50 border border-edge/20 rounded-xl p-6 text-center text-sm text-muted italic">
              No scheduled matches found at the moment.
            </div>
          )}
        </div>

        <div className="bg-gradient-to-br from-surface to-surface-2 border border-edge/30 rounded-2xl p-6 flex flex-col justify-between shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" /> Club Summary
            </span>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-edge/10">
              <span className="text-muted">Club ID:</span>
              <span className="font-semibold text-foreground">
                {selectedTeamId}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-edge/10">
              <span className="text-muted">Total Players:</span>
              <span className="font-semibold text-foreground">
                {Array.isArray(teamPlayers) ? teamPlayers.length : "Available"}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted">Feed Status:</span>
              <span className="font-semibold text-emerald-400">
                Synchronized
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Quick Shortcuts */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted px-1">
          Quick Access
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Lineup */}
          <button
            onClick={() => navigate("/lineup")}
            className="flex items-center justify-between p-4 rounded-2xl bg-surface hover:bg-surface-2 border border-edge/30 hover:border-brand/40 text-left transition-all cursor-pointer group shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground group-hover:text-brand transition-colors">
                  Lineup
                </h4>
                <p className="text-xs text-muted">Squad and tactics</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* Players */}
          <button
            onClick={() => navigate(`/teams/${selectedTeamId}`)}
            className="flex items-center justify-between p-4 rounded-2xl bg-surface hover:bg-surface-2 border border-edge/30 hover:border-brand/40 text-left transition-all cursor-pointer group shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground group-hover:text-brand transition-colors">
                  Players
                </h4>
                <p className="text-xs text-muted">Full roster</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>

          {/* Simulator */}
          <button
            onClick={() => navigate("/simulator")}
            className="flex items-center justify-between p-4 rounded-2xl bg-surface hover:bg-surface-2 border border-edge/30 hover:border-brand/40 text-left transition-all cursor-pointer group shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground group-hover:text-brand transition-colors">
                  Simulator
                </h4>
                <p className="text-xs text-muted">Simulate matches</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>

      {/* 4. Standings Section */}
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted px-1">
        Standings
      </h3>
      <div className="bg-surface border border-edge/30 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Table className="w-4 h-4 text-brand" /> Team Standings
          </h3>
          <button
            onClick={() => navigate(`/teams/${selectedTeamId}`)}
            className="text-xs text-muted hover:text-brand flex items-center gap-1 transition-colors"
          >
            View full <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {Array.isArray(teamStandings) && teamStandings.length > 0 ? (
          <div className="space-y-3">
            {teamStandings.slice(0, 2).map((standing: any, idx: number) => {
              // The endpoint returns the whole league table per competition;
              // our row is the one belonging to this club.
              const row = standing.table?.find(
                (r: any) => String(r.team?.id) === String(selectedTeamId),
              );
              return (
                <div
                  key={standing.seasonId || idx}
                  className="bg-surface-2/50 border border-edge/20 rounded-xl p-4 flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="font-bold text-foreground block">
                      {standing.competition?.name || "Competition"}
                    </span>
                    <span className="text-xs text-muted">
                      {standing.label || "Current season"}
                    </span>
                  </div>
                  <div className="text-right space-y-0.5">
                    <span className="text-sm font-black text-brand block">
                      {row?.position ? `${row.position}º` : "—"}
                    </span>
                    {row && (
                      <span className="text-[11px] text-muted block">
                        {row.points} pts · {row.played} J · {row.won}V {row.drawn}E{" "}
                        {row.lost}D
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface-2/40 border border-edge/20 rounded-xl p-6 text-center text-xs text-muted italic">
            No standings data available for this club at the moment.
          </div>
        )}
      </div>

      {/* 5. News Section */}
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted px-1">
        News
      </h3>
      <div className="bg-surface border border-edge/30 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-amber-400" /> Latest Club News
          </h3>
          <button
            onClick={() => navigate("/news")}
            className="text-xs text-muted hover:text-brand flex items-center gap-1 transition-colors"
          >
            View all <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {Array.isArray(teamNews) && teamNews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamNews.slice(0, 2).map((news: any, idx: number) => (
              <div
                key={news.id || idx}
                className="bg-surface-2/50 border border-edge/20 rounded-xl p-4 space-y-2 flex flex-col justify-between"
              >
                <h4 className="text-sm font-bold text-foreground line-compiler-2">
                  {news.title || news.headline}
                </h4>
                <p className="text-xs text-muted line-clamp-2">
                  {news.summary || news.description}
                </p>
                <span className="text-[10px] text-muted pt-2 border-t border-edge/10 block">
                  {news.date
                    ? new Date(news.date).toLocaleDateString()
                    : "Recently"}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-surface-2/40 border border-edge/20 rounded-xl p-6 text-center text-xs text-muted italic">
            No recent news found for this club.
          </div>
        )}
      </div>
    </div>
  );
}
