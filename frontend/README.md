# Smart Football Hub — Frontend

## Setup
```bash
npm install
npm run dev
```

## Environment Variables
Copy `.env.example` to `.env` and fill in:

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:4000` | Backend API base URL |

The dev server proxies `/api` and `/socket.io` to the backend automatically.

## Auth
Authentication uses **Neon Auth (Stack Auth)**. The frontend stores the user's
access token in `localStorage` under `sfh-token`. To sign in:
1. Integrate the Neon Auth / Stack Auth frontend SDK with your project credentials
2. After sign-in, call `useAppStore.getState().setToken(accessToken)` with the
   JWT access token returned by Stack Auth

Public endpoints (teams, players, matches, news, competitions, standings) work
without a token. Authenticated endpoints (favorites, notifications, simulator,
lineups, profile) require a valid token.
