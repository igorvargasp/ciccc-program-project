# Smart Football Hub — Backend

REST API for the Smart Football Hub platform. Built with **Express + TypeScript**,
**Drizzle ORM** on **Neon** (serverless Postgres), and **Neon Auth (Stack Auth)**
for authentication.

## Stack

| Concern        | Choice                                   |
| -------------- | ---------------------------------------- |
| Runtime        | Node.js 20+ (ESM)                        |
| Language       | TypeScript                               |
| Web framework  | Express 4                                |
| ORM            | Drizzle ORM (`neon-http` driver)         |
| Database       | Neon (serverless Postgres)               |
| Auth           | Neon Auth / Better Auth (JWT via JWKS)   |
| Real-time      | Socket.IO                                |
| AI             | Claude (Anthropic API, `claude-opus-4-8`)|
| Validation     | Zod                                      |

## Getting started

```bash
cd backend
npm install
cp .env.example .env    # then fill in the values
```

Fill `.env` with:

- `DATABASE_URL` — the **pooled** connection string from the Neon dashboard.
- `NEON_AUTH_BASE_URL` — the auth server URL from **Neon Console → your project → Auth**.
  This is the only auth value the backend needs — it verifies access-token JWTs
  against `${NEON_AUTH_BASE_URL}/.well-known/jwks.json`. No client/secret keys
  are used on the backend.

### Create the schema

```bash
npm run db:push        # push the Drizzle schema straight to Neon (fast, dev)
# or, for versioned migrations:
npm run db:generate    # generate SQL migration files in ./drizzle
npm run db:migrate     # apply them
```

### Seed reference data (languages + formations)

```bash
npx tsx src/db/seed.ts
```

### Run

```bash
npm run dev            # watch mode (tsx)
npm run build && npm start
```

The server starts on `http://localhost:4000` (configurable via `PORT`).

## Authentication

Neon Auth (built on Better Auth) is **frontend-first**: the login UI, sessions
and cookies live in the frontend via the Neon Auth client SDK (`@neondatabase/auth-ui`
for React/Vite). There is no Express SDK, and the backend needs no client/secret
keys.

The frontend signs the user in, gets `session.access_token` (a JWT whose `sub`
is the user id), and sends it on every API request:

```
Authorization: Bearer <access_token>
```

The backend verifies that JWT's signature against Neon Auth's public JWKS
(`${NEON_AUTH_BASE_URL}/.well-known/jwks.json`) and, on first contact, provisions
a matching row in the `users` table (just-in-time). Handlers read the identity
from `req.auth`.

> Neon Auth also syncs user/session data into the `neon_auth` schema
> (`neon_auth.user`, `neon_auth.session`, …) in the same database, so an
> alternative to JWT verification is to validate the session by querying that
> schema directly. This project uses the JWT/JWKS approach as it keeps the API
> stateless and decoupled from the frontend's cookie domain.

- `requireAuth()` — rejects requests without a valid token (401).
- `optionalAuth()` — attaches `req.auth` when present, else continues.

## API surface

| Method | Route                                   | Auth | Description                          |
| ------ | --------------------------------------- | ---- | ----------------------------------- |
| GET    | `/health`                               | –    | Health check                        |
| GET    | `/api/teams`                            | –    | List/search teams                   |
| GET    | `/api/teams/:id`                        | –    | Team detail                         |
| GET    | `/api/teams/:id/squad`                  | –    | Team squad                          |
| GET    | `/api/players`                          | –    | List/search players                 |
| GET    | `/api/players/:id`                      | –    | Player detail + statistics          |
| GET    | `/api/matches`                          | –    | Calendar/history (filterable)       |
| GET    | `/api/matches/:id`                      | –    | Match detail + events               |
| GET    | `/api/competitions`                     | –    | List competitions                   |
| GET    | `/api/competitions/:id/seasons`         | –    | Seasons for a competition           |
| GET    | `/api/competitions/:id/standings`       | –    | League table (real or simulated)    |
| GET    | `/api/me`                               | ✅   | Current profile + preferences       |
| PUT    | `/api/me/preferences`                   | ✅   | Update preferences (theme, lang…)   |
| GET    | `/api/favorites`                        | ✅   | Favorite teams                      |
| POST   | `/api/favorites`                        | ✅   | Add a favorite                      |
| DELETE | `/api/favorites/:teamId`                | ✅   | Remove a favorite                   |
| GET    | `/api/lineups`                          | ✅   | The user's saved lineups            |
| GET    | `/api/lineups/:id`                      | ~    | A lineup (owner, or public)         |
| POST   | `/api/lineups`                          | ✅   | Create a lineup                     |
| PUT    | `/api/lineups/:id`                      | ✅   | Update a lineup                     |
| DELETE | `/api/lineups/:id`                      | ✅   | Delete a lineup                     |
| POST   | `/api/shares`                           | ✅   | Create a share link for a lineup    |
| GET    | `/api/shares/:token`                    | –    | Resolve a shared lineup (public)    |
| DELETE | `/api/shares/:token`                    | ✅   | Revoke a share link                 |
| GET    | `/api/news`                             | –    | Latest news (optional `?teamId=`)   |
| POST   | `/api/news/ingest`                      | ✅   | Push articles (sync job) → broadcasts |
| GET    | `/api/i18n/languages`                   | –    | Active languages                    |
| GET    | `/api/i18n/translations`                | –    | Translation map for `?lang=`        |
| POST   | `/api/simulations`                      | ✅   | Run a match simulation → new table  |
| GET    | `/api/simulations`                      | ✅   | Past simulations                    |
| GET    | `/api/notifications`                    | ✅   | The user's notifications            |
| POST   | `/api/notifications/:id/read`           | ✅   | Mark one read                       |
| POST   | `/api/notifications/read-all`           | ✅   | Mark all read                       |
| GET    | `/api/ai/status`                        | –    | Whether AI features are configured  |
| POST   | `/api/ai/predictions`                   | –    | AI match prediction → broadcasts    |
| POST   | `/api/ai/chat`                          | ✅   | Football assistant chatbot          |
| POST   | `/api/ai/transfer`                      | ✅   | AI transfer-market advisor          |

## Real-time (Socket.IO)

The Socket.IO server shares the HTTP port. Clients connect with the same Neon
Auth access token (optional — anonymous clients can still watch public rooms):

```js
import { io } from "socket.io-client";
const socket = io("http://localhost:4000", { auth: { token: accessToken } });

// Subscribe to the rooms you care about
socket.emit("subscribe", { teams: [teamId], matches: [matchId], seasons: [seasonId] });

socket.on("notification:new", (n) => {/* personal — needs a token */});
socket.on("match:update", (m) => {/* live score/events for a match room */});
socket.on("standings:update", (s) => {/* league table, incl. simulator results */});
socket.on("news:new", (a) => {/* new article for a team room */});
socket.on("prediction:new", (p) => {/* AI prediction for a match room */});
```

Rooms: `user:<id>` (auto-joined when authenticated), `team:<id>`, `match:<id>`,
`season:<id>`. Server-side, `src/services/*` emit these events via `emitTo()`.

## AI features

`POST /api/ai/predictions`, `/api/ai/chat`, and `/api/ai/transfer` call Claude
via the Anthropic SDK (`ANTHROPIC_API_KEY`, model `ANTHROPIC_MODEL`, default
`claude-opus-4-8`). Each route assembles context from the database (team form,
standings, recent results, top scorers) and passes it to the model. Without an
API key the endpoints return 503 and `/api/ai/status` reports `enabled: false`,
so the rest of the API keeps working.

## Project structure

```
backend/
├── drizzle.config.ts        # Drizzle Kit config
├── src/
│   ├── index.ts             # server entry (HTTP + Socket.IO)
│   ├── app.ts               # Express app factory
│   ├── config/env.ts        # validated env vars
│   ├── db/
│   │   ├── index.ts         # Neon + Drizzle client
│   │   ├── schema.ts        # full schema (mirrors the ERD)
│   │   └── seed.ts          # reference-data seed
│   ├── lib/                 # http-error, async-handler
│   ├── middleware/          # auth (Neon Auth JWT), error
│   ├── realtime/io.ts       # Socket.IO server, rooms, emit helpers
│   ├── services/            # notifications, simulator, news, ai
│   └── routes/              # one router per resource
└── README.md
```

## Not yet wired (optional follow-ups)

- A scheduled job/worker that calls `ingestArticles()` with a real sports/news
  feed (API-Football, NewsAPI, …) on an interval.
- A live-score poller emitting `match:update` (the event + room already exist;
  a producer just needs to call `emitTo(room.match(id), ...)`).
- Streaming the AI chatbot token-by-token over Socket.IO (currently one REST
  response).
