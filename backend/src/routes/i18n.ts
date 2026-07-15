import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { languages, translations } from "../db/schema.js";
import { asyncHandler } from "../lib/async-handler.js";
import { notFound } from "../lib/http-error.js";

export const i18nRouter = Router();

// GET /api/i18n/languages — active languages
i18nRouter.get(
  "/languages",
  asyncHandler(async (_req, res) => {
    const rows = await db.select().from(languages).where(eq(languages.isActive, true));
    res.json({ data: rows });
  }),
);

const translationsQuery = z.object({
  lang: z.string().min(2).max(8),
  namespace: z.string().min(1).optional(),
});

// GET /api/i18n/translations?lang=en&namespace=common
// Returns a flat { "namespace.key": "value" } map for the frontend i18n library.
i18nRouter.get(
  "/translations",
  asyncHandler(async (req, res) => {
    const { lang, namespace } = translationsQuery.parse(req.query);

    const [language] = await db
      .select({ id: languages.id })
      .from(languages)
      .where(eq(languages.code, lang))
      .limit(1);
    if (!language) throw notFound("Language");

    const filters = [eq(translations.languageId, language.id)];
    if (namespace) filters.push(eq(translations.namespace, namespace));

    const rows = await db
      .select()
      .from(translations)
      .where(and(...filters));

    const map: Record<string, string> = {};
    for (const t of rows) map[`${t.namespace}.${t.key}`] = t.value;

    res.json({ data: { lang, translations: map } });
  }),
);
