/**
 * Seed sample football news articles for development / demo.
 * Run with:  npx tsx scripts/seed-news.ts
 */
import "dotenv/config";
import { ingestArticles } from "../src/services/news.js";

const articles = [
  {
    source: "ESPN FC",
    externalUrl: "https://espnfc.example/real-madrid-champions-league-preview",
    title: "Real Madrid eye record-breaking Champions League run as squad hits peak form",
    summary:
      "Carlo Ancelotti's side head into the knockout stages with a fully fit squad and renewed confidence after a dominant group-stage campaign.",
    imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
    publishedAt: new Date(Date.now() - 2 * 3_600_000),
  },
  {
    source: "BBC Sport",
    externalUrl: "https://bbc.example/premier-league-title-race-2026",
    title: "Premier League title race: four clubs still separated by just three points",
    summary:
      "With eight matches remaining the title fight is the closest it has been in a decade, and every Saturday feels like a mini-final.",
    imageUrl: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=800&q=80",
    publishedAt: new Date(Date.now() - 5 * 3_600_000),
  },
  {
    source: "Sky Sports",
    externalUrl: "https://skysports.example/mbappe-injury-update",
    title: "Mbappé set to return from injury ahead of crucial league fixture",
    summary:
      "The French striker has been cleared to resume full training after a three-week absence, providing a major boost to his side's attacking options.",
    imageUrl: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&q=80",
    publishedAt: new Date(Date.now() - 8 * 3_600_000),
  },
  {
    source: "Fabrizio Romano",
    externalUrl: "https://fabrizio.example/transfer-window-roundup-aug-2026",
    title: "Summer transfer window: every confirmed deal from the top five leagues",
    summary:
      "A comprehensive round-up of all completed transfers as clubs finalise their squads before the deadline.",
    imageUrl: "https://images.unsplash.com/photo-1551958219-acbc3d4a8945?w=800&q=80",
    publishedAt: new Date(Date.now() - 14 * 3_600_000),
  },
  {
    source: "The Athletic",
    externalUrl: "https://theathletic.example/tactics-high-press-2026",
    title: "How the high press became the defining tactical identity of modern football",
    summary:
      "An in-depth analysis of how pressing metrics have changed across Europe's top leagues and which managers are leading the way.",
    imageUrl: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=800&q=80",
    publishedAt: new Date(Date.now() - 20 * 3_600_000),
  },
  {
    source: "Globo Esporte",
    externalUrl: "https://globoesporte.example/brasileirao-rodada-22-destaques",
    title: "Brasileirão Série A: Flamengo e Palmeiras empatam em clássico eletrizante",
    summary:
      "O duelo de gigantes terminou em 2 a 2 com dois gols nos acréscimos, mantendo os dois clubes separados por apenas um ponto na liderança.",
    imageUrl: "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=800&q=80",
    publishedAt: new Date(Date.now() - 26 * 3_600_000),
  },
  {
    source: "Goal",
    externalUrl: "https://goal.example/bundesliga-bayer-leverkusen-unbeaten",
    title: "Bayer Leverkusen extend unbeaten Bundesliga run to 34 games",
    summary:
      "Xabi Alonso's side kept their remarkable sequence alive with a late winner, continuing to set new records in German football.",
    imageUrl: "https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=800&q=80",
    publishedAt: new Date(Date.now() - 32 * 3_600_000),
  },
  {
    source: "Marca",
    externalUrl: "https://marca.example/la-liga-clasico-preview-2026",
    title: "El Clásico preview: both teams enter Sunday's showdown without key defenders",
    summary:
      "Injuries in defence could shape the outcome of the biggest game of the La Liga season, with both coaches forced to improvise.",
    imageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80",
    publishedAt: new Date(Date.now() - 40 * 3_600_000),
  },
  {
    source: "ESPN FC",
    externalUrl: "https://espnfc.example/serie-a-inter-milan-scudetto-charge",
    title: "Inter Milan's Scudetto charge: why Inzaghi's system is built to last",
    summary:
      "A look inside the tactical blueprint that has made Inter the most consistent team in Serie A over the past 18 months.",
    imageUrl: "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=800&q=80",
    publishedAt: new Date(Date.now() - 48 * 3_600_000),
  },
];

console.log(`Seeding ${articles.length} sample news articles…`);
const inserted = await ingestArticles(articles);
console.log(`✅ Done — ${inserted.length} articles written to database.`);
process.exit(0);
