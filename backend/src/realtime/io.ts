import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { env } from "../config/env.js";
import { verifyToken, type AuthUser } from "../middleware/auth.js";

/**
 * Socket.IO real-time layer for the Smart Football Hub.
 *
 * Rooms:
 *   user:<userId>          — personal notifications for an authenticated user
 *   team:<teamId>          — team news / important updates
 *   match:<matchId>        — live match score & events
 *   season:<seasonId>      — league-standings updates (incl. simulator results)
 *
 * Clients authenticate with the same Neon Auth access token used for the REST
 * API, passed in the connection handshake `auth.token`. Authentication is
 * optional: anonymous sockets can still subscribe to public rooms (teams,
 * matches, standings) but never join a personal `user:` room.
 */

export const RT = {
  // server → client events
  NOTIFICATION_NEW: "notification:new",
  MATCH_UPDATE: "match:update",
  STANDINGS_UPDATE: "standings:update",
  NEWS_NEW: "news:new",
  PREDICTION_NEW: "prediction:new",
  // client → server events
  SUBSCRIBE: "subscribe",
  UNSUBSCRIBE: "unsubscribe",
} as const;

export const room = {
  user: (id: string) => `user:${id}`,
  team: (id: string) => `team:${id}`,
  match: (id: string) => `match:${id}`,
  season: (id: string) => `season:${id}`,
};

interface SubscribePayload {
  teams?: string[];
  matches?: string[];
  seasons?: string[];
}

// Sockets carry their authenticated user (if any) on `socket.data.auth`.
type SocketData = { auth?: AuthUser };

let io: Server | null = null;

export function initIo(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",").map((s) => s.trim()),
      credentials: true,
    },
  });

  // Optional auth handshake — attach the user if a valid token is present.
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (token) {
      try {
        (socket.data as SocketData).auth = await verifyToken(token);
      } catch {
        // Ignore — continue as an anonymous socket.
      }
    }
    next();
  });

  io.on("connection", (socket: Socket) => {
    const auth = (socket.data as SocketData).auth;
    if (auth) socket.join(room.user(auth.id));

    socket.on(RT.SUBSCRIBE, (payload: SubscribePayload) => joinRooms(socket, payload));
    socket.on(RT.UNSUBSCRIBE, (payload: SubscribePayload) => leaveRooms(socket, payload));
  });

  return io;
}

function eachRoom(payload: SubscribePayload, fn: (r: string) => void) {
  payload?.teams?.forEach((id) => fn(room.team(id)));
  payload?.matches?.forEach((id) => fn(room.match(id)));
  payload?.seasons?.forEach((id) => fn(room.season(id)));
}

function joinRooms(socket: Socket, payload: SubscribePayload) {
  eachRoom(payload, (r) => socket.join(r));
}

function leaveRooms(socket: Socket, payload: SubscribePayload) {
  eachRoom(payload, (r) => socket.leave(r));
}

/** Access the initialized server. Throws if the server hasn't started yet. */
export function getIo(): Server {
  if (!io) throw new Error("Socket.IO not initialized — call initIo() first");
  return io;
}

/** Safe emit helper: no-ops if the real-time layer isn't running (e.g. tests). */
export function emitTo(target: string, event: string, data: unknown) {
  io?.to(target).emit(event, data);
}

/** Broadcast to every connected client (e.g. the daily cross-league digest). */
export function emitGlobal(event: string, data: unknown) {
  io?.emit(event, data);
}
