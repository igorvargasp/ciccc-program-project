import { io, type Socket } from 'socket.io-client';
import { API_ORIGIN } from '../api/client';

// Empty in dev — the Vite proxy forwards /socket.io to the backend.
const SOCKET_URL = API_ORIGIN;

let _socket: Socket | null = null;

function buildSocket(): Socket {
  const token = localStorage.getItem('sfh-token');
  return io(SOCKET_URL, {
    auth: { token: token ?? undefined },
    autoConnect: false,
    transports: ['websocket', 'polling'],
  });
}

export function getSocket(): Socket {
  if (!_socket) _socket = buildSocket();
  return _socket;
}

/** Connect (or reconnect with a fresh token after sign-in). */
export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

/** Disconnect and clear the singleton so the next call picks up a new token. */
export function disconnectSocket(): void {
  _socket?.disconnect();
  _socket = null;
}

/** After signing in, recreate the socket with the new auth token. */
export function reinitSocket(): Socket {
  disconnectSocket();
  _socket = buildSocket();
  _socket.connect();
  return _socket;
}

/** Real-time event names mirroring the backend RT constants. */
export const RT = {
  NOTIFICATION_NEW: 'notification:new',
  MATCH_UPDATE: 'match:update',
  STANDINGS_UPDATE: 'standings:update',
  NEWS_NEW: 'news:new',
  PREDICTION_NEW: 'prediction:new',
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
} as const;
