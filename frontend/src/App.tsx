import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import { LoginCard } from "./components/Auth/LoginCard";
import { RegisterPage } from "./components/Auth/RegisterCard";

function App() {
  const { user, logout, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState<"login" | "register">("login");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#111317] text-[#e2e2e8]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00d2fd]"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#111317] text-[#e2e2e8] p-6 font-['Archivo_Narrow']">
        <div className="text-center space-y-4 max-w-md bg-[#1e2024] border border-[#414755] p-8 shadow-2xl">
          <span className="text-xs font-bold text-[#00d2fd] uppercase tracking-widest bg-[#00d2fd]/10 px-3 py-1.5 border border-[#00d2fd]/20">
            LOGADO COM SUCESSO
          </span>
          <h1 className="text-3xl font-bold">Bem-vindo, {user.name}!</h1>
          <p className="text-[#c1c6d7]">
            Você está autenticado com o e-mail{" "}
            <strong className="text-[#e2e2e8]">{user.email}</strong>.
          </p>
          <div className="pt-4">
            <button
              onClick={logout}
              className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold transition-all"
            >
              Fazer Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (authScreen === "login") {
    return <LoginCard onSwitchToRegister={() => setAuthScreen("register")} />;
  }

  return <RegisterPage onSwitchToLogin={() => setAuthScreen("login")} />;
}

export default App;
