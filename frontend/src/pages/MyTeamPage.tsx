import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTeamsMap } from "@/hooks/useTeamsMap";
import { useAuth } from "@/context/AuthContext";
import { getTeam } from "../api/teams";
import { apiErrorMessage, suggestTransfers } from "../api/ai";
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
  Target,
  ShieldAlert,
  TrendingUp,
  BrainCircuit,
  Sparkles,
  Loader2,
  AlertCircle,
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

  // Estados do Transfer Advisor em miniatura
  const [transferSuggestions, setTransferSuggestions] = useState<any[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [transferError, setTransferError] = useState("");

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
      // Limpa as sugestões anteriores ao mudar de time
      setTransferSuggestions([]);
      setTransferError("");
    };

    window.addEventListener("favoriteTeamChanged", handleFavoriteChange);
    return () => {
      window.removeEventListener("favoriteTeamChanged", handleFavoriteChange);
    };
  }, []);

  const selectedTeamId = favoriteTeam?.id || user?.favoriteTeamId;
  const teamObj = selectedTeamId ? teamsMap.get(String(selectedTeamId)) : null;

  const { data: detailedTeam } = useQuery({
    queryKey: ["team-detail", selectedTeamId],
    queryFn: () => getTeam(String(selectedTeamId)),
    enabled: !!selectedTeamId,
    staleTime: 5 * 60_000,
  });

  const teamName =
    favoriteTeam?.name ||
    detailedTeam?.name ||
    (teamObj as any)?.name ||
    "My Team";

  const teamLogo =
    favoriteTeam?.logo ||
    favoriteTeam?.crest ||
    favoriteTeam?.crestUrl ||
    detailedTeam?.crestUrl ||
    detailedTeam?.crest ||
    (teamObj as any)?.crest ||
    (teamObj as any)?.crestUrl ||
    (teamObj as any)?.logo;

  const teamCountry =
    detailedTeam?.country ||
    (teamObj as any)?.country ||
    (teamObj as any)?.area?.name ||
    "Global";

  const teamVenue =
    favoriteTeam?.venue ||
    favoriteTeam?.stadium ||
    detailedTeam?.stadium ||
    detailedTeam?.venue ||
    (teamObj as any)?.venue ||
    (teamObj as any)?.stadium ||
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

  // Função para buscar as sugestões do Transfer Advisor via API (Com Correção de Auth 401)
  const handleFetchTransferSuggestions = async () => {
    if (!selectedTeamId) return;

    setLoadingTransfers(true);
    setTransferError("");

    try {
      setTransferSuggestions(await suggestTransfers(String(selectedTeamId)));
    } catch (err: unknown) {
      setTransferError(apiErrorMessage(err, "Error fetching AI suggestions"));
    } finally {
      setLoadingTransfers(false);
    }
  };

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
            className="px-5 py-2.5 rounded-xl bg-brand text-white font-medium text-sm hover:opacity-95 transition-all shadow-md cursor-pointer"
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

  const matchCompetition =
    displayMatch?.competition || displayMatch?.tournament;
  // The API now sends the real competition on every fixture, so this fallback
  // should no longer be what the user sees.
  const competitionName =
    matchCompetition?.name || matchCompetition || "Official Competition";
  const competitionLogo =
    matchCompetition?.logo ||
    matchCompetition?.crest ||
    matchCompetition?.emblem ||
    matchCompetition?.logoUrl;

  const teamStats = detailedTeam?.stats || {};
  const goalsScored = teamStats?.goals?.scored ?? teamStats?.goalsFor ?? "—";
  const goalsConceded =
    teamStats?.goals?.conceded ?? teamStats?.goalsAgainst ?? "—";
  const winRate = teamStats?.general?.winRate ?? teamStats?.winRate ?? "—";

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
            className="px-4 py-2 rounded-xl bg-brand text-white font-medium text-xs hover:opacity-95 transition-all shadow-md flex items-center gap-2 cursor-pointer"
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

      {/* 2. Highlighted Information Grid (Matches & Club Advanced Summary) */}
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted px-1">
        Matchday & Club Insights
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
              View matches calendar <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {loadingMatches ? (
            <div className="py-6 text-center text-sm text-muted animate-pulse">
              Loading match information...
            </div>
          ) : displayMatch ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 bg-surface border border-edge/20 px-3 py-1.5 rounded-xl w-fit mx-auto shadow-sm">
                {competitionLogo ? (
                  <img
                    src={competitionLogo}
                    alt={competitionName}
                    className="w-4 h-4 object-contain"
                  />
                ) : (
                  <Trophy className="w-3.5 h-3.5 text-brand" />
                )}
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {competitionName}
                  {displayMatch.matchday ? ` · R${displayMatch.matchday}` : ""}
                </span>
              </div>

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
                    {displayMatch.utcDate || displayMatch.kickoffAt
                      ? new Date(
                          displayMatch.utcDate || displayMatch.kickoffAt,
                        ).toLocaleDateString()
                      : "Coming soon"}
                  </span>
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
            </div>
          ) : (
            <div className="bg-surface-2/50 border border-edge/20 rounded-xl p-6 text-center text-sm text-muted italic">
              No scheduled matches found at the moment.
            </div>
          )}
        </div>

        {/* Club Summary com Estatísticas Reais */}
        <div className="bg-gradient-to-br from-surface to-surface-2 border border-edge/30 rounded-2xl p-6 flex flex-col justify-between shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" /> Season Stats
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-2/60 p-3 rounded-xl border border-edge/10 flex flex-col items-center text-center">
              <Target className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="text-[10px] text-muted uppercase tracking-wider">
                Goals For
              </span>
              <span className="text-base font-black text-foreground">
                {goalsScored}
              </span>
            </div>
            <div className="bg-surface-2/60 p-3 rounded-xl border border-edge/10 flex flex-col items-center text-center">
              <ShieldAlert className="w-4 h-4 text-rose-400 mb-1" />
              <span className="text-[10px] text-muted uppercase tracking-wider">
                Conceded
              </span>
              <span className="text-base font-black text-foreground">
                {goalsConceded}
              </span>
            </div>
          </div>
          <div className="space-y-2 text-xs pt-1">
            <div className="flex justify-between py-1.5 border-b border-edge/10">
              <span className="text-muted flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-brand" /> Win Rate:
              </span>
              <span className="font-bold text-foreground">{winRate}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-muted">Total Roster:</span>
              <span className="font-semibold text-foreground">
                {Array.isArray(teamPlayers) ? teamPlayers.length : "Available"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2.1 Transfer Advisor Miniature Widget */}
      <div className="bg-gradient-to-br from-surface to-surface-2 border border-edge/30 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                AI Transfer Advisor{" "}
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              </h3>
              <p className="text-xs text-muted">
                Smart reinforcement recommendations for {teamName}
              </p>
            </div>
          </div>

          <button
            onClick={handleFetchTransferSuggestions}
            disabled={loadingTransfers}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loadingTransfers ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing
                Squad...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Generate AI Suggestions
              </>
            )}
          </button>
        </div>

        {transferError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {transferError}
          </div>
        )}

        {transferSuggestions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {transferSuggestions.map((s: any, idx: number) => (
              <div
                key={idx}
                className="bg-surface-2/60 border border-edge/20 hover:border-indigo-500/40 rounded-xl p-4 flex flex-col justify-between space-y-2 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {s.weakPosition || s.position}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-400">
                    Fit: {s.fitScore}%
                  </span>
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  {s.playerName || s.rationale?.split(" — ")[0]}
                </h4>
                <p className="text-xs text-muted line-clamp-2">{s.rationale}</p>
              </div>
            ))}
          </div>
        ) : (
          !loadingTransfers && (
            <div className="bg-surface-2/40 border border-edge/20 rounded-xl p-5 text-center text-xs text-muted italic">
              Click "Generate AI Suggestions" to analyze squad weaknesses and
              explore ideal player signings tailored for {teamName}.
            </div>
          )
        )}
      </div>

      {/* 3. Quick Shortcuts */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted px-1">
          Quick Access
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            className="text-xs text-muted hover:text-brand flex items-center gap-1 transition-colors cursor-pointer"
          >
            View full <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {Array.isArray(teamStandings) && teamStandings.length > 0 ? (
          <div className="space-y-3">
            {teamStandings.slice(0, 3).map((standing: any, idx: number) => {
              // The endpoint returns the whole league table per competition,
              // so the club's own numbers live in the row belonging to it —
              // reading them off `standing` itself is what left this blank.
              const row =
                standing.table?.find(
                  (r: any) => String(r.team?.id) === String(selectedTeamId),
                ) ?? standing;

              return (
                <div
                  key={standing.seasonId || idx}
                  className="bg-surface-2/50 border border-edge/20 rounded-xl p-4 flex items-center justify-between text-sm"
                >
                  <div>
                    <span className="font-bold text-foreground block">
                      {standing.competition?.name ||
                        standing.tournament ||
                        "League Championship"}
                    </span>
                    <span className="text-xs text-muted">
                      Played: {row.played ?? row.playedGames ?? 0} | Won:{" "}
                      {row.won ?? 0} | Drawn: {row.drawn ?? row.draw ?? 0} |
                      Lost: {row.lost ?? 0}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-brand block bg-brand/10 px-3 py-1 rounded-lg border border-brand/25">
                      {row.position ? `${row.position}º Place` : "Position N/A"}
                    </span>
                    <span className="text-[11px] text-muted mt-1 block">
                      Points:{" "}
                      <strong className="text-foreground">
                        {row.points ?? 0}
                      </strong>
                    </span>
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
            className="text-xs text-muted hover:text-brand flex items-center gap-1 transition-colors cursor-pointer"
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
                <h4 className="text-sm font-bold text-foreground line-clamp-2">
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
