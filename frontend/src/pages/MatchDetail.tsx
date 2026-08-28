import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Trophy,
  ShieldAlert,
  Target,
  TrendingUp,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  Home,
  Plane,
  Bell,
  BellRing,
  Star,
} from "lucide-react";
import { getMatch, getMatchContext } from "../api/matches";
import { getTeam } from "../api/teams";
import { getCompetitionStandings } from "../api/competitions";
import { PageSpinner } from "../components/ui/Spinner";
import Badge from "../components/ui/Badge";
import { useMatchRealtime } from "../hooks/useRealtime";
import { formatMatchDay, formatKickoff, cn } from "../lib/utils";

const EVENT_ICONS: Record<string, string> = {
  goal: "⚽",
  assist: "🎯",
  yellow: "🟨",
  red: "🟥",
  sub: "🔄",
};

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();

  // Local states for Match Notifications and Favorite Team (My Team)
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [myTeamId, setMyTeamId] = useState<string | null>(() => {
    return localStorage.getItem("user_my_team_id");
  });

  const toggleFavoriteTeam = (teamId: string) => {
    if (myTeamId === teamId) {
      setMyTeamId(null);
      localStorage.removeItem("user_my_team_id");
    } else {
      setMyTeamId(teamId);
      localStorage.setItem("user_my_team_id", teamId);
    }
  };

  useMatchRealtime(id);

  const { data: match, isLoading } = useQuery({
    queryKey: ["match", id],
    queryFn: () => getMatch(id!),
    enabled: !!id,
    refetchInterval: (query) =>
      query.state.data?.status === "live" ? 30_000 : false,
  });

  const { data: homeTeam } = useQuery({
    queryKey: ["team", match?.homeTeamId],
    queryFn: () => getTeam(match!.homeTeamId),
    enabled: !!match?.homeTeamId,
  });

  const { data: awayTeam } = useQuery({
    queryKey: ["team", match?.awayTeamId],
    queryFn: () => getTeam(match!.awayTeamId),
    enabled: !!match?.awayTeamId,
  });

  const competitionId = match?.competition?.id || match?.competitionId;
  const { data: standingsData } = useQuery({
    queryKey: ["standings", competitionId],
    queryFn: () => getCompetitionStandings(competitionId!),
    enabled: !!competitionId,
  });

  // Form, head-to-head and league position, all derived from matches we
  // already store — so an upcoming fixture has something to show even though
  // there is nothing to report on yet.
  const { data: context } = useQuery({
    queryKey: ["match-context", id],
    queryFn: () => getMatchContext(id!),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });

  if (isLoading) return <PageSpinner />;
  if (!match)
    return <p className="text-muted p-4 text-center">{t("errors.notFound")}</p>;

  const isFinished = match.status === "finished";

  const statusBadge =
    match.status === "live" ? (
      <Badge variant="live" dot>
        {t("matches.live")}
      </Badge>
    ) : isFinished ? (
      <Badge variant="finished" className="flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5" />
        {t("matches.fulltime")}
      </Badge>
    ) : (
      <Badge variant="scheduled">{t("matches.upcoming")}</Badge>
    );

  const stadiumName =
    homeTeam?.stadium || match.venue || t("matchDetail.stadiumNotProvided");

  const homeStanding = standingsData?.table?.find(
    (row: any) => row.team.id === match.homeTeamId,
  );
  const awayStanding = standingsData?.table?.find(
    (row: any) => row.team.id === match.awayTeamId,
  );

  const homePosition = homeStanding?.position ?? "—";
  const awayPosition = awayStanding?.position ?? "—";

  return (
    <div className="space-y-4 sm:space-y-6 max-w-2xl mx-auto px-3 sm:px-4 pb-12">
      <Link
        to="/matches"
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors pt-2"
      >
        <ArrowLeft className="w-4 h-4" /> {t("common.back")}
      </Link>

      {/* Competition */}
      {match.competition && (
        <div className="flex items-center gap-2 bg-surface border border-edge/12 px-3 sm:px-4 py-2.5 rounded-xl shadow-sm">
          {match.competition.logoUrl ? (
            <img
              src={match.competition.logoUrl}
              alt=""
              className="w-5 h-5 object-contain"
            />
          ) : (
            <Trophy className="w-4 h-4 text-[#00d2fd]" />
          )}
          <span className="text-xs font-bold text-foreground uppercase tracking-wider truncate">
            {match.competition.name}
          </span>
        </div>
      )}

      {/* Scoreboard / Main Score */}
      <div
        className={cn(
          "bg-surface border rounded-2xl p-4 sm:p-6 transition-all shadow-lg",
          isFinished
            ? "border-amber-500/30 bg-gradient-to-b from-surface to-surface-2/40"
            : "border-edge/12",
        )}
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
          <div className="flex items-center gap-2">{statusBadge}</div>

          {/* Notifications Button (Bell) & Matchday */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSubscribed(!isSubscribed)}
              title={
                isSubscribed
                  ? t("matchDetail.notificationsDisable")
                  : t("matchDetail.notificationsEnable")
              }
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
                isSubscribed
                  ? "bg-[#00d2fd]/10 text-[#00d2fd] border-[#00d2fd]/30"
                  : "bg-surface-2 text-muted border-edge/12 hover:text-foreground",
              )}
            >
              {isSubscribed ? (
                <BellRing className="w-4 h-4 animate-bounce shrink-0" />
              ) : (
                <Bell className="w-4 h-4 shrink-0" />
              )}
            </button>
            {match.matchday && (
              <span className="text-xs font-semibold text-[#00d2fd] uppercase tracking-wider">
                {t("matchDetail.matchday", { matchday: match.matchday })}
              </span>
            )}
          </div>
        </div>

        {/* Teams and Responsive Score */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Home team */}
          <div className="flex flex-col items-center gap-2 flex-1 relative min-w-0">
            <button
              onClick={() => toggleFavoriteTeam(match.homeTeamId)}
              title={
                myTeamId === match.homeTeamId
                  ? t("matchDetail.removeFavorite")
                  : t("matchDetail.setMyTeam")
              }
              className="absolute top-0 left-0 sm:left-2 p-1.5 rounded-full hover:bg-surface-2 transition-colors text-amber-400 z-10"
            >
              <Star
                className={cn(
                  "w-4 h-4 transition-transform active:scale-125",
                  myTeamId === match.homeTeamId
                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                    : "text-muted hover:text-amber-400",
                )}
              />
            </button>

            {homeTeam?.crestUrl ? (
              <img
                src={homeTeam.crestUrl}
                alt={homeTeam.name}
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-md mt-4 sm:mt-0"
              />
            ) : (
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-surface-2 flex items-center justify-center mt-4 sm:mt-0">
                <span className="text-xs sm:text-sm font-black text-muted">
                  {homeTeam?.shortName ?? "?"}
                </span>
              </div>
            )}
            <Link
              to={`/teams/${match.homeTeamId}`}
              className="text-xs sm:text-sm font-bold text-foreground hover:text-[#00d2fd] transition-colors text-center line-clamp-2 px-1"
            >
              {homeTeam?.name ?? "—"}
            </Link>
          </div>

          {/* Score */}
          <div className="text-center flex-shrink-0 px-1 sm:px-2">
            {match.status !== "scheduled" ? (
              <div className="flex flex-col items-center">
                <span className="text-3xl sm:text-5xl font-black text-foreground tracking-tight">
                  {match.homeScore ?? "?"} – {match.awayScore ?? "?"}
                </span>
                {isFinished && (
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-amber-400 mt-1 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 whitespace-nowrap">
                    {t("matchDetail.finalResult")}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-lg sm:text-xl font-bold text-muted">
                {t("common.vs")}
              </span>
            )}
          </div>

          {/* Away team */}
          <div className="flex flex-col items-center gap-2 flex-1 relative min-w-0">
            <button
              onClick={() => toggleFavoriteTeam(match.awayTeamId)}
              title={
                myTeamId === match.awayTeamId
                  ? t("matchDetail.removeFavorite")
                  : t("matchDetail.setMyTeam")
              }
              className="absolute top-0 right-0 sm:right-2 p-1.5 rounded-full hover:bg-surface-2 transition-colors text-amber-400 z-10"
            >
              <Star
                className={cn(
                  "w-4 h-4 transition-transform active:scale-125",
                  myTeamId === match.awayTeamId
                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                    : "text-muted hover:text-amber-400",
                )}
              />
            </button>

            {awayTeam?.crestUrl ? (
              <img
                src={awayTeam.crestUrl}
                alt={awayTeam.name}
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-md mt-4 sm:mt-0"
              />
            ) : (
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-surface-2 flex items-center justify-center mt-4 sm:mt-0">
                <span className="text-xs sm:text-sm font-black text-muted">
                  {awayTeam?.shortName ?? "?"}
                </span>
              </div>
            )}
            <Link
              to={`/teams/${match.awayTeamId}`}
              className="text-xs sm:text-sm font-bold text-foreground hover:text-[#00d2fd] transition-colors text-center line-clamp-2 px-1"
            >
              {awayTeam?.name ?? "—"}
            </Link>
          </div>
        </div>

        {/* Detailed info with Vertical Standings and Adjusted Stadium */}
        <div className="mt-6 pt-4 sm:mt-8 sm:pt-6 border-t border-edge/12 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          {/* Standings Block (Stacked / Vertical) */}
          <div className="bg-surface-2 p-3 rounded-xl flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 text-[#00d2fd]">
              <Layers className="w-4 h-4" />
              <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                {t("matchDetail.standings")}
              </span>
            </div>

            <div className="flex items-center justify-around w-full gap-2">
              {/* Home Team */}
              <div className="flex flex-col items-center text-center">
                <span className="text-xs font-semibold text-foreground">
                  {homeTeam?.shortName || t("matchDetail.home")}
                </span>
                <span className="text-xs text-muted mt-0.5">
                  <strong className="text-[#00d2fd] font-black">
                    {homePosition}º
                  </strong>
                </span>
              </div>

              <span className="text-[10px] font-bold text-muted uppercase">
                vs
              </span>

              {/* Away Team */}
              <div className="flex flex-col items-center text-center">
                <span className="text-xs font-semibold text-foreground">
                  {awayTeam?.shortName || t("matchDetail.away")}
                </span>
                <span className="text-xs text-muted mt-0.5">
                  <strong className="text-[#00d2fd] font-black">
                    {awayPosition}º
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Date and Time Block */}
          <div className="bg-surface-2 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
            <Calendar className="w-4 h-4 text-[#00d2fd]" />
            <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">
              {t("matchDetail.dateAndTime")}
            </span>
            <span className="text-xs font-bold text-foreground">
              {formatMatchDay(match.kickoffAt)} {t("matchDetail.at")}{" "}
              {formatKickoff(match.kickoffAt)}
            </span>
          </div>

          {/* Match Venue Block (Fixed to prevent text clipping) */}
          <div className="bg-surface-2 p-3 rounded-xl flex flex-col items-center justify-center gap-1">
            <MapPin className="w-4 h-4 text-[#00d2fd]" />
            <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">
              {t("matchDetail.venue")}
            </span>
            <span className="text-xs font-bold text-foreground px-2 leading-snug break-words">
              {stadiumName}
            </span>
          </div>
        </div>
      </div>

      {/* Match Report / Expectations */}
      {isFinished ? (
        <div className="bg-surface border border-edge/12 rounded-2xl p-4 sm:p-5 shadow-md space-y-4">
          <h3 className="text-xs font-black text-amber-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <span>🏁</span> {t("matchDetail.finishedReport")}
          </h3>

          {match.events && match.events.length > 0 ? (
            <ol className="space-y-3 relative border-l border-edge/20 ml-3 pl-4 pt-2">
              {match.events.map((ev: any, index: number) => (
                <li
                  key={ev.id || index}
                  className={cn(
                    "flex items-start gap-3 relative text-xs sm:text-sm",
                    // Nudge each event toward the club it belongs to, so the
                    // timeline reads as two columns rather than one list.
                    ev.isHome === false && "sm:ml-8",
                  )}
                >
                  <span
                    className={cn(
                      "absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-surface",
                      ev.type === "goal" ? "bg-emerald-400" : "bg-[#00d2fd]",
                    )}
                  />
                  <span className="font-bold text-muted w-8 sm:w-10 flex-shrink-0 pt-0.5">
                    {ev.minute != null ? `${ev.minute}'` : "—"}
                  </span>
                  <span className="text-base">
                    {EVENT_ICONS[ev.type] ?? "•"}
                  </span>

                  {ev.playerPhotoUrl && (
                    <img
                      src={ev.playerPhotoUrl}
                      alt={ev.playerName ?? ""}
                      className="w-7 h-7 rounded-full object-cover bg-surface-2 flex-shrink-0"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    {ev.type === "sub" ? (
                      // A substitution has no scorer and no assist: the two
                      // names are the player leaving and the one arriving.
                      <p className="truncate">
                        <span className="text-emerald-400 font-semibold">
                          ▲ {ev.assistName ?? "?"}
                        </span>
                        <span className="text-muted"> · </span>
                        <span className="text-red-400/80">
                          ▼ {ev.playerName ?? "?"}
                        </span>
                      </p>
                    ) : (
                      <>
                        <p
                          className={cn(
                            "font-semibold truncate",
                            ev.type === "goal" && "text-emerald-400 font-bold",
                          )}
                        >
                          {ev.playerName ??
                            (ev.type === "goal"
                              ? t("matchDetail.goal")
                              : ev.type)}
                        </p>
                        {ev.assistName && (
                          <p className="text-xs text-muted truncate">
                            {t("matchDetail.assist", "assist")}: {ev.assistName}
                          </p>
                        )}
                      </>
                    )}
                    {ev.detail && !ev.playerName && (
                      <p className="text-xs text-muted truncate">{ev.detail}</p>
                    )}
                  </div>

                  <span className="text-[10px] text-muted flex-shrink-0 pt-1 hidden sm:block">
                    {ev.isHome
                      ? (homeTeam?.shortName ?? homeTeam?.name ?? "")
                      : (awayTeam?.shortName ?? awayTeam?.name ?? "")}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="bg-surface-2/60 border border-edge/8 p-3 sm:p-4 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <p className="text-xs text-muted">
                {t("matchDetail.finishedWithoutEvents", {
                  homeScore: match.homeScore,
                  awayScore: match.awayScore,
                })}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-surface border border-edge/12 rounded-2xl p-4 sm:p-5 shadow-md space-y-4">
          <h3 className="text-xs font-black text-[#00d2fd] uppercase tracking-[0.2em] flex items-center gap-2">
            <span>⏳</span> {t("matchDetail.upcomingExpectations")}
          </h3>

          {context ? (
            <div className="space-y-4">
              {/* Recent Form */}
              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ["home", homeTeam, context.form.home],
                    ["away", awayTeam, context.form.away],
                  ] as const
                ).map(([side, team, form]) => (
                  <div
                    key={side}
                    className="bg-surface-2/60 border border-edge/10 rounded-xl p-3 space-y-2"
                  >
                    <p className="text-[11px] font-bold text-muted uppercase tracking-wider truncate">
                      {team?.shortName || team?.name || side}
                    </p>
                    <div className="flex gap-1">
                      {form.length ? (
                        form.map((f: any, i: number) => (
                          <span
                            key={i}
                            title={`${f.scored ?? "?"}–${f.conceded ?? "?"}`}
                            className={cn(
                              "w-6 h-6 rounded-md text-[11px] font-black flex items-center justify-center",
                              f.result === "W" &&
                                "bg-emerald-500/20 text-emerald-400",
                              f.result === "D" &&
                                "bg-amber-500/20 text-amber-400",
                              f.result === "L" && "bg-red-500/20 text-red-400",
                              !f.result && "bg-surface text-muted",
                            )}
                          >
                            {f.result ?? "?"}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted italic">
                          {t("common.noData")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Head-to-Head */}
              {context.headToHead.matches.length > 0 && (
                <div className="bg-surface-2/60 border border-edge/10 rounded-xl p-3">
                  <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                    {t("matchDetail.headToHead", "Head-to-head")} ·{" "}
                    {context.headToHead.matches.length}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-black text-emerald-400">
                      {context.headToHead.homeWins}
                    </span>
                    <span className="text-muted text-xs">
                      {t("matchDetail.draws", "draws")}{" "}
                      <strong className="text-foreground">
                        {context.headToHead.draws}
                      </strong>
                    </span>
                    <span className="font-black text-red-400">
                      {context.headToHead.awayWins}
                    </span>
                  </div>
                </div>
              )}

              {/* Table Position */}
              {(context.standings.home || context.standings.away) && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {(
                    [context.standings.home, context.standings.away] as const
                  ).map((s: any, i: number) =>
                    s ? (
                      <div
                        key={i}
                        className="bg-surface-2/60 border border-edge/10 rounded-xl p-3"
                      >
                        <span className="text-lg font-black text-[#00d2fd]">
                          {s.position}º
                        </span>
                        <span className="text-muted ml-2">
                          {s.points} pts · {s.played} P
                        </span>
                      </div>
                    ) : (
                      <div key={i} />
                    ),
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted">
              {t("matchDetail.upcomingDescription")}
            </p>
          )}
        </div>
      )}

      {/* Match Statistics (shots, possession, fouls...) */}
      {match.stats && match.stats.length > 0 && (
        <div className="bg-surface border border-edge/12 rounded-2xl p-4 sm:p-5 shadow-md space-y-3">
          <h3 className="text-xs font-black text-[#00d2fd] uppercase tracking-[0.2em] flex items-center gap-2">
            <span>📊</span> {t("matchDetail.matchStats", "Statistics")}
          </h3>
          <div className="space-y-2">
            {match.stats.map((s: any) => {
              const home = Number(s.home ?? 0);
              const away = Number(s.away ?? 0);
              const total = home + away;
              const homePct = total > 0 ? (home / total) * 100 : 50;
              return (
                <div key={s.stat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground w-10">
                      {s.home ?? "—"}
                    </span>
                    <span className="text-muted text-[11px] truncate px-2">
                      {s.stat.replace(/_/g, " ")}
                    </span>
                    <span className="font-bold text-foreground w-10 text-right">
                      {s.away ?? "—"}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden flex">
                    <div
                      className="bg-[#00d2fd]"
                      style={{ width: `${homePct}%` }}
                    />
                    <div
                      className="bg-amber-400/70"
                      style={{ width: `${100 - homePct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Team Statistics Block */}
      {(homeTeam?.stats || awayTeam?.stats) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {homeTeam?.stats && (
            <div className="bg-surface border border-edge/12 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#00d2fd] truncate">
                Stats - {homeTeam.shortName || homeTeam.name}
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-surface-2 p-2 rounded-lg">
                  <TrendingUp className="w-4 h-4 mx-auto text-[#00d2fd] mb-1" />
                  <span className="text-[10px] text-muted block">
                    {t("matchDetail.winRate")}
                  </span>
                  <span className="text-xs font-black text-foreground">
                    {homeTeam.stats.general.winRate}
                  </span>
                </div>
                <div className="bg-surface-2 p-2 rounded-lg">
                  <Target className="w-4 h-4 mx-auto text-[#00d2fd] mb-1" />
                  <span className="text-[10px] text-muted block">
                    {t("matchDetail.goalsFor")}
                  </span>
                  <span className="text-xs font-black text-foreground">
                    {homeTeam.stats.goals.scored}
                  </span>
                </div>
                <div className="bg-surface-2 p-2 rounded-lg">
                  <ShieldAlert className="w-4 h-4 mx-auto text-rose-400 mb-1" />
                  <span className="text-[10px] text-muted block">
                    {t("matchDetail.goalsAgainst")}
                  </span>
                  <span className="text-xs font-black text-foreground">
                    {homeTeam.stats.goals.conceded}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="bg-surface-2 p-2 rounded-lg flex items-center justify-between px-3">
                  <span className="text-[10px] text-muted flex items-center gap-1">
                    <Home className="w-3 h-3 text-[#00d2fd]" />{" "}
                    {t("matchDetail.homeWins")}
                  </span>
                  <span className="text-xs font-black text-foreground">
                    {homeTeam.stats.venuePerformance.homeWins}
                  </span>
                </div>
                <div className="bg-surface-2 p-2 rounded-lg flex items-center justify-between px-3">
                  <span className="text-[10px] text-muted flex items-center gap-1">
                    <Plane className="w-3 h-3 text-[#00d2fd]" />{" "}
                    {t("matchDetail.awayWins")}
                  </span>
                  <span className="text-xs font-black text-foreground">
                    {homeTeam.stats.venuePerformance.awayWins}
                  </span>
                </div>
              </div>
            </div>
          )}

          {awayTeam?.stats && (
            <div className="bg-surface border border-edge/12 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#00d2fd] truncate">
                Stats - {awayTeam.shortName || awayTeam.name}
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-surface-2 p-2 rounded-lg">
                  <TrendingUp className="w-4 h-4 mx-auto text-[#00d2fd] mb-1" />
                  <span className="text-[10px] text-muted block">
                    {t("matchDetail.winRate")}
                  </span>
                  <span className="text-xs font-black text-foreground">
                    {awayTeam.stats.general.winRate}
                  </span>
                </div>
                <div className="bg-surface-2 p-2 rounded-lg">
                  <Target className="w-4 h-4 mx-auto text-[#00d2fd] mb-1" />
                  <span className="text-[10px] text-muted block">
                    {t("matchDetail.goalsFor")}
                  </span>
                  <span className="text-xs font-black text-foreground">
                    {awayTeam.stats.goals.scored}
                  </span>
                </div>
                <div className="bg-surface-2 p-2 rounded-lg">
                  <ShieldAlert className="w-4 h-4 mx-auto text-rose-400 mb-1" />
                  <span className="text-[10px] text-muted block">
                    {t("matchDetail.goalsAgainst")}
                  </span>
                  <span className="text-xs font-black text-foreground">
                    {awayTeam.stats.goals.conceded}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="bg-surface-2 p-2 rounded-lg flex items-center justify-between px-3">
                  <span className="text-[10px] text-muted flex items-center gap-1">
                    <Home className="w-3 h-3 text-[#00d2fd]" />{" "}
                    {t("matchDetail.homeWins")}
                  </span>
                  <span className="text-xs font-black text-foreground">
                    {awayTeam.stats.venuePerformance.homeWins}
                  </span>
                </div>
                <div className="bg-surface-2 p-2 rounded-lg flex items-center justify-between px-3">
                  <span className="text-[10px] text-muted flex items-center gap-1">
                    <Plane className="w-3 h-3 text-[#00d2fd]" />{" "}
                    {t("matchDetail.awayWins")}
                  </span>
                  <span className="text-xs font-black text-foreground">
                    {awayTeam.stats.venuePerformance.awayWins}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
