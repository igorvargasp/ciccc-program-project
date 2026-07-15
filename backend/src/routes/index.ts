import { Router } from "express";
import { adminRouter } from "./admin.js";
import { aiRouter } from "./ai.js";
import { competitionsRouter } from "./competitions.js";
import { favoritesRouter } from "./favorites.js";
import { i18nRouter } from "./i18n.js";
import { lineupsRouter } from "./lineups.js";
import { matchesRouter } from "./matches.js";
import { meRouter } from "./me.js";
import { newsRouter } from "./news.js";
import { notificationsRouter } from "./notifications.js";
import { playersRouter } from "./players.js";
import { sharesRouter } from "./shares.js";
import { simulationsRouter } from "./simulations.js";
import { teamsRouter } from "./teams.js";

export const apiRouter = Router();

// Public resources
apiRouter.use("/teams", teamsRouter);
apiRouter.use("/players", playersRouter);
apiRouter.use("/matches", matchesRouter);
apiRouter.use("/competitions", competitionsRouter);
apiRouter.use("/news", newsRouter);
apiRouter.use("/i18n", i18nRouter);
apiRouter.use("/shares", sharesRouter);
apiRouter.use("/ai", aiRouter);

// Authenticated resources
apiRouter.use("/me", meRouter);
apiRouter.use("/favorites", favoritesRouter);
apiRouter.use("/lineups", lineupsRouter);
apiRouter.use("/simulations", simulationsRouter);
apiRouter.use("/notifications", notificationsRouter);
apiRouter.use("/admin", adminRouter);
