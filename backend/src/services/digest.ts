import { and, eq, gte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "../db/index.js";
import {
  competitions,
  matches,
  newsArticles,
  seasons,
  teams,
  userFavoriteTeams,
} from "../db/schema.js";
import { emitGlobal, RT } from "../realtime/io.js";
import { aiEnabled, narrateDigest } from "./ai.js";
import { createNotification } from "./notifications.js";

/**
 * Once-a-day cross-league digest.
 *
 * Gathers every match that finished in the last ~36h, writes one news article
 * per competition (optionally with an AI-written roundup), broadcasts them to
 * all clients, and sends each user a personal notification about their favorite
 * team's latest result — so everyone sees what's happening across every team.
 */
export async function buildDailyDigest() {
  const cutoff = new Date(Date.now() - 36 * 3_600_000);
  const date = new Date().toISOString().slice(0, 10);

  const home = alias(teams, "home");
  const away = alias(teams, "away");

  const rows = await db
    .select({
      kickoffAt: matches.kickoffAt,
      homeScore: matches.homeScore,
      awayScore: matches.awayScore,
      homeTeamId: matches.homeTeamId,
      awayTeamId: matches.awayTeamId,
      homeName: home.name,
      awayName: away.name,
      competitionId: competitions.id,
      competitionExtId: competitions.externalApiId,
      competitionName: competitions.name,
    })
    .from(matches)
    .innerJoin(home, eq(matches.homeTeamId, home.id))
    .innerJoin(away, eq(matches.awayTeamId, away.id))
    .innerJoin(seasons, eq(matches.seasonId, seasons.id))
    .innerJoin(competitions, eq(seasons.competitionId, competitions.id))
    .where(and(eq(matches.status, "finished"), gte(matches.kickoffAt, cutoff)));

  if (!rows.length) {
    console.log("[digest] no finished matches in window");
    return { articles: [], matches: 0 };
  }

  // Group results by competition, and track each team's latest result line.
  const byComp = new Map<string, { name: string; extId: string | null; lines: string[] }>();
  const teamResult = new Map<string, { when: number; text: string }>();

  const recordTeam = (teamId: string, when: number, text: string) => {
    const cur = teamResult.get(teamId);
    if (!cur || when > cur.when) teamResult.set(teamId, { when, text });
  };

  for (const r of rows) {
    const line = `${r.homeName} ${r.homeScore ?? "-"}–${r.awayScore ?? "-"} ${r.awayName}`;
    const group = byComp.get(r.competitionId) ?? {
      name: r.competitionName,
      extId: r.competitionExtId,
      lines: [],
    };
    group.lines.push(line);
    byComp.set(r.competitionId, group);

    const when = r.kickoffAt ? r.kickoffAt.getTime() : 0;
    recordTeam(r.homeTeamId, when, line);
    recordTeam(r.awayTeamId, when, line);
  }

  // One article per competition (idempotent per day via externalUrl).
  const articles = [];
  for (const [compId, g] of byComp) {
    const resultsText = g.lines.join("\n");
    let summary = resultsText;
    if (aiEnabled()) {
      try {
        const roundup = await narrateDigest(`${g.name} results (${date}):\n${resultsText}`);
        summary = `${roundup}\n\n${resultsText}`;
      } catch (err) {
        console.error("[digest] AI roundup failed:", err instanceof Error ? err.message : err);
      }
    }

    const externalUrl = `digest://${date}/${g.extId ?? compId}`;
    const [article] = await db
      .insert(newsArticles)
      .values({
        source: "Daily Digest",
        externalUrl,
        teamId: null,
        title: `${g.name} — daily results (${date})`,
        summary,
        publishedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: newsArticles.externalUrl,
        set: { summary, title: `${g.name} — daily results (${date})` },
      })
      .returning();

    articles.push(article);
    emitGlobal(RT.NEWS_NEW, article);
  }

  // Personal notifications: tell each user how their primary team did.
  const favs = await db
    .select({ userId: userFavoriteTeams.userId, teamId: userFavoriteTeams.teamId })
    .from(userFavoriteTeams)
    .where(eq(userFavoriteTeams.isPrimary, true));

  for (const fav of favs) {
    const res = teamResult.get(fav.teamId);
    if (res) {
      await createNotification({
        userId: fav.userId,
        type: "result",
        title: "Your team's latest result",
        body: res.text,
      });
    }
  }

  console.log(`[digest] ${articles.length} competition articles, ${rows.length} matches`);
  return { articles, matches: rows.length };
}
