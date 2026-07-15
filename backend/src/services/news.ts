import { db } from "../db/index.js";
import { newsArticles } from "../db/schema.js";
import { emitTo, room, RT } from "../realtime/io.js";

export interface IncomingArticle {
  source?: string;
  externalUrl: string;
  teamId?: string;
  title: string;
  summary?: string;
  imageUrl?: string;
  publishedAt?: Date;
}

/**
 * Ingest articles pulled from a sports/news API (or added manually).
 *
 * Upserts by `externalUrl` so re-running the fetch is idempotent, and pushes a
 * `news:new` event to the relevant team room for any freshly-inserted article
 * so subscribed clients get live headlines.
 *
 * Wire an external feed by scheduling a job that calls this with the mapped
 * provider payload (API-Football, NewsAPI, etc.).
 */
export async function ingestArticles(articles: IncomingArticle[]) {
  const inserted = [];

  for (const a of articles) {
    const [row] = await db
      .insert(newsArticles)
      .values({
        source: a.source,
        externalUrl: a.externalUrl,
        teamId: a.teamId,
        title: a.title,
        summary: a.summary,
        imageUrl: a.imageUrl,
        publishedAt: a.publishedAt,
      })
      .onConflictDoUpdate({
        target: newsArticles.externalUrl,
        set: { title: a.title, summary: a.summary, imageUrl: a.imageUrl },
      })
      .returning();

    if (row?.teamId) emitTo(room.team(row.teamId), RT.NEWS_NEW, row);
    inserted.push(row);
  }

  return inserted;
}
