import { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

//LOGIN AND REGISTER PAGE:
import { LoginCard } from "./components/Auth/LoginCard";
import { RegisterPage } from "./components/Auth/RegisterCard";

// USER TERMS PAGE:
import { TermsPage } from "./pages/TermsPage";

// DASHBOARD PAGE:
import { Dashboard } from "./components/Dashboard/FavoriteTeamBanner";

// MATCHES PAGE:
import { UpcomingMatches } from "./components/Matches/UpcomingMatches";

// STANDINGS PAGE:
import { StandingsTable } from "./components/Standings/StandingsTable";

// SelectFavoriteTeamModal PAGE:
import { SelectFavoriteTeamModal } from "./components/Modals/SelectFavoriteTeamModal";

// LINEUP PAGE:
import { LineupPage } from "./components/Lineup/LineupPage";

export interface Team {
  id: string | number;
  name: string;
  badgeUrl?: string;
  country?: string;
}

interface SavedLineup {
  id: string;
  title: string;
  formation: string;
  createdAt: string;
}

export function App() {
  const { user, logout, loading } = useAuth();

  const [authScreen, setAuthScreen] = useState<"login" | "register" | "terms">(
    "login",
  );

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Burguer Menu

  const [savedLineups, setSavedLineups] = useState<SavedLineup[]>([]);

  useEffect(() => {
    const loadedLineups = localStorage.getItem("saved_dream_teams");
    if (loadedLineups) {
      try {
        setSavedLineups(JSON.parse(loadedLineups));
      } catch (e) {
        console.error("Error loading lineups", e);
      }
    }
  }, []);

  const handleDeleteLineup = (id: string) => {
    const updated = savedLineups.filter((item) => item.id !== id);
    setSavedLineups(updated);
    localStorage.setItem("saved_dream_teams", JSON.stringify(updated));
  };

  useEffect(() => {
    if (user && !user.favoriteTeamId) {
      const savedTeam = localStorage.getItem("favorite_team");
      if (!savedTeam) {
        setIsTeamModalOpen(true);
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#111317] text-[#e2e2e8]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00d2fd]"></div>
      </div>
    );
  }

  if (user) {
    const handleConfirmTeam = (team: Team) => {
      localStorage.setItem("favorite_team", JSON.stringify(team));
      setIsTeamModalOpen(false);
      window.dispatchEvent(new Event("favoriteTeamChanged"));
    };

    const localSavedTeam = localStorage.getItem("favorite_team");
    const currentTeamFallback =
      user.favoriteTeamId ||
      (localSavedTeam ? JSON.parse(localSavedTeam) : null);

    return (
      <div className="min-h-screen bg-[#111317] text-[#e2e2e8] font-['Archivo_Narrow'] relative">
        <header className="bg-[#1e2024] border-b border-[#414755] px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-[#00d2fd] uppercase tracking-widest bg-[#00d2fd]/10 px-2 py-1 border border-[#00d2fd]/20">
              CONNECTED
            </span>
            <span className="text-sm italic font-semibold text-[#c1c6d7]">
              {user.name}
            </span>
            <span
              className="material-symbols-outlined text-[#00d2fd] text-4xl transform -rotate-12 transition-transform hover:rotate-0 duration-300"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              sports_soccer
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={logout}
              className="px-4 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold transition-all cursor-pointer"
            >
              Log Out
            </button>

            {/* Burger Menu Button */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 bg-[#0d0f12] border border-[#414755]/30 text-[#00d2fd] hover:border-[#00d2fd] transition-all cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>
          </div>
        </header>

        {/* Right Menu / Drawer */}
        {isMenuOpen && (
          <div
            className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          >
            <div
              className="w-80 bg-[#14171c] border-l border-[#00d2fd]/30 p-6 flex flex-col justify-between shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#414755]/30 pb-4">
                  <span className="text-xs font-black text-[#00d2fd] uppercase tracking-[0.2em]">
                    Navigation Matrix
                  </span>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="text-[#8b90a0] hover:text-[#e2e2e8] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">
                      close
                    </span>
                  </button>
                </div>

                <nav className="flex flex-col space-y-2">
                  <Link
                    to="/"
                    onClick={() => setIsMenuOpen(false)}
                    className="p-3 bg-[#0d0f12] border border-[#414755]/20 hover:border-[#00d2fd] text-xs font-bold uppercase tracking-widest text-left transition-all text-[#e2e2e8] hover:text-[#00d2fd]"
                  >
                    Dashboard / Home
                  </Link>
                  <Link
                    to="/matches"
                    onClick={() => setIsMenuOpen(false)}
                    className="p-3 bg-[#0d0f12] border border-[#414755]/20 hover:border-[#00d2fd] text-xs font-bold uppercase tracking-widest text-left transition-all text-[#e2e2e8] hover:text-[#00d2fd]"
                  >
                    Matches
                  </Link>
                  <Link
                    to="/lineup"
                    onClick={() => setIsMenuOpen(false)}
                    className="p-3 bg-[#0d0f12] border border-[#414755]/20 hover:border-[#00d2fd] text-xs font-bold uppercase tracking-widest text-left transition-all text-[#e2e2e8] hover:text-[#00d2fd]"
                  >
                    Lineup
                  </Link>
                  <Link
                    to="/standings"
                    onClick={() => setIsMenuOpen(false)}
                    className="p-3 bg-[#0d0f12] border border-[#414755]/20 hover:border-[#00d2fd] text-xs font-bold uppercase tracking-widest text-left transition-all text-[#e2e2e8] hover:text-[#00d2fd]"
                  >
                    Standings
                  </Link>
                </nav>
              </div>

              <div className="border-t border-[#414755]/30 pt-4 text-[10px] text-[#8b90a0] uppercase tracking-wider text-center">
                Operator System v2.6
              </div>
            </div>
          </div>
        )}

        {/* Routes */}
        <main className="p-6 max-w-7xl mx-auto space-y-6">
          <Routes>
            <Route
              path="/"
              element={
                <div className="space-y-6">
                  <Dashboard onOpenTeamModal={() => setIsTeamModalOpen(true)} />

                  {/* Saved Dream Teams */}
                  <section className="bg-[#14171c] border border-[#414755]/30 rounded-xl p-5 shadow-lg">
                    <div className="flex items-center justify-between mb-4 border-b border-[#414755]/30 pb-3">
                      <h3 className="text-xs font-black text-[#00d2fd] uppercase tracking-[0.2em] flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">
                          tactics
                        </span>
                        My Saved Dream Teams ({savedLineups.length})
                      </h3>
                    </div>

                    {savedLineups.length === 0 ? (
                      <p className="text-xs text-[#8b90a0] italic py-2">
                        No dream teams saved yet. Build your lineup in the
                        lineup builder and save it!
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {savedLineups.map((lineup) => (
                          <div
                            key={lineup.id}
                            className="bg-[#0d0f12] border border-[#414755]/30 hover:border-[#00d2fd]/50 p-4 rounded-lg flex flex-col justify-between space-y-3 transition-all"
                          >
                            <div>
                              <div className="flex justify-between items-start">
                                <h4 className="text-sm font-bold text-[#e2e2e8] uppercase tracking-wide">
                                  {lineup.title}
                                </h4>
                                <span className="text-[10px] bg-[#00d2fd]/10 text-[#00d2fd] border border-[#00d2fd]/20 px-2 py-0.5 rounded font-mono">
                                  {lineup.formation}
                                </span>
                              </div>
                              <span className="text-[10px] text-[#8b90a0]">
                                Created at:{" "}
                                {new Date(
                                  lineup.createdAt,
                                ).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-[#414755]/20">
                              <span className="text-[10px] text-[#00d2fd] uppercase font-bold tracking-wider">
                                Tactical Setup
                              </span>
                              <button
                                onClick={() => handleDeleteLineup(lineup.id)}
                                className="text-[#8b90a0] hover:text-red-400 transition-colors cursor-pointer text-xs flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-sm">
                                  delete
                                </span>
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-12 space-y-6">
                      <UpcomingMatches />
                    </div>
                  </div>
                </div>
              }
            />

            <Route
              path="/matches"
              element={
                <div className="space-y-6">
                  <div className="bg-[#14171c] border border-[#414755]/30 rounded-xl p-5">
                    <h2 className="text-sm font-black text-[#00d2fd] uppercase tracking-[0.2em] mb-4">
                      Matches Page
                    </h2>
                    <UpcomingMatches />
                  </div>
                </div>
              }
            />

            <Route
              path="/lineup"
              element={
                <div className="bg-[#14171c] border border-[#414755]/30 rounded-xl p-5">
                  <LineupPage />
                </div>
              }
            />

            <Route
              path="/standings"
              element={
                <div className="bg-[#14171c] border border-[#414755]/30 rounded-xl p-5">
                  <StandingsTable />
                </div>
              }
            />
          </Routes>
        </main>

        <SelectFavoriteTeamModal
          isOpen={isTeamModalOpen}
          isFirstTime={!currentTeamFallback}
          currentTeam={currentTeamFallback}
          onConfirm={handleConfirmTeam}
          onClose={() => setIsTeamModalOpen(false)}
        />
      </div>
    );
  }

  if (authScreen === "login") {
    return <LoginCard onSwitchToRegister={() => setAuthScreen("register")} />;
  }

  if (authScreen === "terms") {
    return <TermsPage onBack={() => setAuthScreen("register")} />;
  }

  return (
    <RegisterPage
      onSwitchToLogin={() => setAuthScreen("login")}
      onOpenTerms={() => setAuthScreen("terms")}
      onSuccessRegister={() => setAuthScreen("login")}
    />
  );
}

export default App;
