import { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { LoginCard } from "./components/Auth/LoginCard";
import { RegisterPage } from "./components/Auth/RegisterCard";
import { TermsPage } from "./pages/TermsPage";
import { Dashboard } from "./components/Dashboard/FavoriteTeamBanner";
import { MatchesTabs } from "./components/Matches/MatchesTabs";
import { StandingsTable } from "./components/Standings/StandingsTable";
import { SelectFavoriteTeamModal } from "./components/Modals/SelectFavoriteTeamModal";

// Definição da interface do Time para evitar o uso de 'any'
export interface Team {
  id: string | number;
  name: string;
  badgeUrl?: string;
  country?: string;
}

export function App() {
  const { user, logout, loading } = useAuth();

  const [authScreen, setAuthScreen] = useState<"login" | "register" | "terms">(
    "login",
  );

  // Estado para controlar a visibilidade do modal de forma independente
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // Efeito para abrir o modal no primeiro acesso, desde que não haja time salvo no localStorage
  useEffect(() => {
    if (user && !user.favoriteTeam) {
      const savedTeam = localStorage.getItem("favorite_team");
      if (!savedTeam) {
        setIsTeamModalOpen(true);
      }
    }
  }, [user]);

  // Tela de Carregamento Inicial
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#111317] text-[#e2e2e8]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00d2fd]"></div>
      </div>
    );
  }

  // ==========================================
  // TELA DO USUÁRIO LOGADO (DASHBOARD)
  // ==========================================
  if (user) {
    const handleConfirmTeam = (team: Team) => {
      // 1. Salva no localStorage imediatamente para persistir a escolha
      localStorage.setItem("favorite_team", JSON.stringify(team));

      // 2. Fecha o modal de forma definitiva alterando o estado local
      setIsTeamModalOpen(false);
    };

    // Recupera o time do localStorage caso o contexto demore para atualizar
    const localSavedTeam = localStorage.getItem("favorite_team");
    const currentTeamFallback =
      user.favoriteTeam || (localSavedTeam ? JSON.parse(localSavedTeam) : null);

    return (
      <div className="min-h-screen bg-[#111317] text-[#e2e2e8] font-['Archivo_Narrow'] relative">
        {/* Barra Superior */}
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
            {/* Botão para Trocar Time */}
            <button
              onClick={() => setIsTeamModalOpen(true)}
              className="px-3 py-1.5 text-xs bg-[#00d2fd]/10 hover:bg-[#00d2fd]/20 text-[#00d2fd] border border-[#00d2fd]/30 font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">
                swap_horiz
              </span>
              Change Team
            </button>

            {/* Botão de Log Out */}
            <button
              onClick={logout}
              className="px-4 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold transition-all cursor-pointer"
            >
              Log Out
            </button>
          </div>
        </header>

        {/* Conteúdo Principal */}
        <main className="p-6 max-w-7xl mx-auto space-y-6">
          <Dashboard />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <MatchesTabs />
            </div>
            <div className="lg:col-span-5">
              <StandingsTable />
            </div>
          </div>
        </main>

        {/* Modal de Seleção de Time */}
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

  // ==========================================
  // TELAS DE AUTENTICAÇÃO (DESLOGADO)
  // ==========================================
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
