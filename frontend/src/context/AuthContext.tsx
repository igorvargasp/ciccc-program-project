import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AUTH_EXPIRED_EVENT, authClient, fetchAuthJwt } from "@/auth";
import { useAppStore } from "@/store/app";
import { disconnectSocket, reinitSocket } from "@/lib/socket";

// USER TYPE:
interface User {
  id: string;
  name: string;
  email: string;
  favoriteTeamId: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateFavoriteTeam: (teamId: string | number) => void;
  loading: boolean;
}

const FAVORITE_TEAM_KEY = "favorite_team";
const FAVORITE_TEAM_EVENT = "favoriteTeamChanged";
/** Key written by the old mock login — cleared on boot so it can't linger. */
const LEGACY_USER_KEY = "ali_score_user";

/** The favourite team is owned by SelectFavoriteTeamModal; we only read the id. */
function readFavoriteTeamId(): string | null {
  const saved = localStorage.getItem(FAVORITE_TEAM_KEY);
  if (!saved) return null;
  try {
    const parsed = JSON.parse(saved) as { id?: string | number };
    return parsed?.id != null ? String(parsed.id) : null;
  } catch {
    return null;
  }
}

function toUser(sessionUser: {
  id: string;
  name?: string | null;
  email?: string | null;
}): User {
  return {
    id: sessionUser.id,
    name: sessionUser.name || "Fan",
    email: sessionUser.email ?? "",
    favoriteTeamId: readFavoriteTeamId(),
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const setToken = useAppStore((s) => s.setToken);

  /**
   * Read the session from Neon Auth and refresh the bearer token our API client
   * sends. Returns the signed-in user, or null when there is no live session.
   */
  const syncSession = useCallback(async (): Promise<User | null> => {
    const { data } = await authClient.getSession();

    if (!data?.user) {
      setUser(null);
      setToken(null);
      return null;
    }

    setToken(await fetchAuthJwt());
    const next = toUser(data.user);
    setUser(next);
    return next;
  }, [setToken]);

  // Restore the session on boot — the Neon Auth cookie outlives a reload.
  useEffect(() => {
    localStorage.removeItem(LEGACY_USER_KEY);

    syncSession()
      .catch(() => {
        setUser(null);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [syncSession, setToken]);

  // Keep `favoriteTeamId` in step with whoever writes the localStorage record.
  useEffect(() => {
    const sync = () =>
      setUser((prev) =>
        prev ? { ...prev, favoriteTeamId: readFavoriteTeamId() } : prev,
      );

    window.addEventListener(FAVORITE_TEAM_EVENT, sync);
    return () => window.removeEventListener(FAVORITE_TEAM_EVENT, sync);
  }, []);

  // The API client raises this when the session can no longer mint a token.
  useEffect(() => {
    const expire = () => {
      setUser(null);
      setToken(null);
      disconnectSocket();
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, expire);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, expire);
  }, [setToken]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) throw new Error(error.message || "Invalid email or password.");

      await syncSession();
      reinitSocket();
    },
    [syncSession],
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name,
      });
      if (error) throw new Error(error.message || "Sign up failed.");

      // Sign-up does not always open a session (e.g. when email verification is
      // required), so fall back to an explicit sign-in.
      if (await syncSession()) {
        reinitSocket();
      } else {
        await login(email, password);
      }
    },
    [login, syncSession],
  );

  const logout = useCallback(async () => {
    try {
      await authClient.signOut();
    } finally {
      setUser(null);
      setToken(null);
      // The favourite team is stored per-browser, not per-account — drop it so
      // the next user to sign in here doesn't inherit it.
      localStorage.removeItem(FAVORITE_TEAM_KEY);
      window.dispatchEvent(new Event(FAVORITE_TEAM_EVENT));
      disconnectSocket();
    }
  }, [setToken]);

  const updateFavoriteTeam = useCallback((teamId: string | number) => {
    const id = String(teamId);
    const saved = localStorage.getItem(FAVORITE_TEAM_KEY);

    let record: Record<string, unknown> = { id };
    if (saved) {
      try {
        record = { ...(JSON.parse(saved) as Record<string, unknown>), id };
      } catch {
        // Corrupt record — replace it with the bare id.
      }
    }

    localStorage.setItem(FAVORITE_TEAM_KEY, JSON.stringify(record));
    window.dispatchEvent(new Event(FAVORITE_TEAM_EVENT));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, updateFavoriteTeam, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
};
