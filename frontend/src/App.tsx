import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { LoginCard } from "./components/Auth/LoginCard";
import { RegisterPage } from "./components/Auth/RegisterCard";
import { TermsPage } from "./pages/TermsPage";
import { Dashboard } from "./components/Dashboard/FavoriteTeamBanner";
import { MatchesTabs } from "./components/Matches/MatchesTabs";
// Importação da nova tabela de classificação
import { StandingsTable } from "./components/Standings/StandingsTable";

function App() {
  const { user, logout, loading } = useAuth();

  const [authScreen, setAuthScreen] = useState<"login" | "register" | "terms">(
    "login",
  );

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
    return (
      <div className="min-h-screen bg-[#111317] text-[#e2e2e8] font-['Archivo_Narrow'] relative">
        {/* Barra superior discreta para mostrar o usuário e o botão de sair */}
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

          <button
            onClick={logout}
            className="px-4 py-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold transition-all cursor-pointer"
          >
            Log Out
          </button>
        </header>

        {/* Conteúdo Principal */}
        <main className="p-6 max-w-7xl mx-auto space-y-6">
          {/* Banner do Time Favorito (Fica no topo em largura total) */}
          <Dashboard />

          {/* Grid Layout: Divide as partidas da tabela de classificação */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Coluna da Esquerda: Partidas e Simulador (Ocupa 7 das 12 colunas) */}
            <div className="lg:col-span-7 space-y-6">
              <MatchesTabs />
            </div>

            {/* Coluna da Direita: Classificação da Liga (Ocupa 5 das 12 colunas) */}
            <div className="lg:col-span-5">
              <StandingsTable />
            </div>
          </div>
        </main>
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
    />
  );
}

export default App;
