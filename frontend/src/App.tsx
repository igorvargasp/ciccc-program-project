import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, type ReactNode } from "react";
import { useAppStore } from "./store/app";
import { useAuth } from "./context/AuthContext";
import AppShell from "./components/layout/AppShell";

// AUTH COMPONENTS:
import { LoginCard } from "./components/auth/LoginCard";
import { RegisterPage } from "./components/auth/RegisterCard";

// HOMEPAGE:
import Home from "./pages/Home";

// TEAMS:
import Teams from "./pages/Teams";
import TeamDetail from "./pages/TeamDetail";

// MATCHES:
import Matches from "./pages/Matches";
import MatchDetail from "./pages/MatchDetail";

// STANDINGS:
import Competitions from "./pages/Competitions";
import CompetitionDetail from "./pages/CompetitionDetail";

// PLAYERS:
import Players from "./pages/Players";
import PlayerDetail from "./pages/PlayerDetail";

// NEWS:
import News from "./pages/News";

// SIMULATOR:
import Simulator from "./pages/Simulator";

// PROFILE:
import Profile from "./pages/Profile";

// NOTIFICATIONS:
import Notifications from "./pages/Notifications";

// USER TERMS PAGE:
import { TermsPage } from "./pages/TermsPage";

// LINEUP PAGE:
import { LineupPage } from "./pages/LineupPage";

// MY TEAM PAGE:
import MyTeamPage from "./pages/MyTeamPage";

/** Syncs the `dark` class on <html> whenever theme changes. */
function ThemeSync() {
  const { theme } = useAppStore();

  useEffect(() => {
    const apply = (th: string) => {
      const isDark =
        th === "dark" ||
        (th === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", isDark);
    };

    apply(theme);

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = (e: MediaQueryListEvent) =>
        document.documentElement.classList.toggle("dark", e.matches);
      mq.addEventListener("change", listener);
      return () => mq.removeEventListener("change", listener);
    }
  }, [theme]);

  return null;
}

/** Shown while the Neon Auth session is being restored. */
function AuthSplash() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <span className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
    </div>
  );
}

/** Gates the app shell — no session, no protected routes. */
function RequireAuth() {
  const { user, loading } = useAuth();

  if (loading) return <AuthSplash />;
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell />;
}

/** Keeps signed-in users off the login/register screens. */
function PublicOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <AuthSplash />;
  if (user) return <Navigate to="/home" replace />;
  return <>{children}</>;
}

export default function App() {
  const navigate = useNavigate();

  return (
    <>
      <ThemeSync />
      <Routes>
        <Route
          path="/"
          element={
            <PublicOnly>
              <LoginCard onSwitchToRegister={() => navigate("/register")} />
            </PublicOnly>
          }
        />

        <Route
          path="login"
          element={
            <PublicOnly>
              <LoginCard onSwitchToRegister={() => navigate("/register")} />
            </PublicOnly>
          }
        />

        <Route
          path="register"
          element={
            <PublicOnly>
              <RegisterPage
                onSwitchToLogin={() => navigate("/login")}
                onOpenTerms={() => navigate("/terms")}
                onSuccessRegister={() => navigate("/home")}
              />
            </PublicOnly>
          }
        />

        <Route
          path="terms"
          element={<TermsPage onBack={() => navigate("/register")} />}
        />

        <Route element={<RequireAuth />}>
          <Route path="home" element={<Home />} />
          <Route path="matches" element={<Matches />} />
          <Route path="matches/:id" element={<MatchDetail />} />
          <Route path="my-team" element={<MyTeamPage />} />
          <Route path="competitions" element={<Competitions />} />
          <Route path="competitions/:id" element={<CompetitionDetail />} />
          <Route path="teams" element={<Teams />} />
          <Route path="teams/:id" element={<TeamDetail />} />
          <Route path="players" element={<Players />} />
          <Route path="lineup" element={<LineupPage />} />
          <Route path="players/:id" element={<PlayerDetail />} />
          <Route path="news" element={<News />} />
          <Route path="simulator" element={<Simulator />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  );
}
