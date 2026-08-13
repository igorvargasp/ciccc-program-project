import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAppStore } from "./store/app";
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

export default function App() {
  const navigate = useNavigate();

  return (
    <>
      <ThemeSync />
      <Routes>
        {/* Rota inicial de Login */}
        <Route
          path="/"
          element={
            <LoginCard onSwitchToRegister={() => navigate("/register")} />
          }
        />

        {/* Outras rotas públicas de autenticação */}
        <Route
          path="login"
          element={
            <LoginCard onSwitchToRegister={() => navigate("/register")} />
          }
        />

        <Route
          path="register"
          element={
            <RegisterPage
              onSwitchToLogin={() => navigate("/login")}
              onOpenTerms={() => navigate("/terms")}
              onSuccessRegister={() => navigate("/home")}
            />
          }
        />

        <Route
          path="terms"
          element={<TermsPage onBack={() => navigate("/register")} />}
        />

        {/* Rotas Protegidas / Com Layout Padrão */}
        <Route element={<AppShell />}>
          <Route path="home" element={<Home />} />
          <Route path="matches" element={<Matches />} />
          <Route path="matches/:id" element={<MatchDetail />} />
          <Route path="/my-team" element={<MyTeamPage />} />
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
