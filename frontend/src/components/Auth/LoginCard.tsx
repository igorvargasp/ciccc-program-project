import React, { useState } from "react";

interface LoginCardProps {
  onSwitchToRegister: () => void;
}

export function LoginCard({ onSwitchToRegister }: LoginCardProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Estados de foco para alterar a cor dos ícones dinamicamente
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Sua lógica de login/autenticação aqui
    console.log({ email, password, rememberMe });
  };

  return (
    <div className="flex min-h-screen bg-[#111317] w-full font-['Archivo_Narrow'] text-[#e2e2e8]">
      {/* Coluna Esquerda: Hero / Painel de Imagem (Apenas Desktop) */}
      <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#111317]">
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-transparent to-[#111317]"></div>
        <div className="absolute inset-0 z-0 scale-105 opacity-60 mix-blend-overlay">
          <img
            className="w-full h-full object-cover"
            alt="Estádio de futebol moderno com iluminação cinematográfica azul"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvWz2gMf6tv04RkCPwcEYW4alw15GDiSkBJuZqsDEMSDtaYOrg9QdNRO4q-1-1dcvDNewDo4mnCbRzD3lkxDUjuuSDzCp-qd9AG7sbLHGn4_npjMm7ycWdyXUU9NHz-sAaCTQXFm35-0MfvPrBdDPMPwbfXBr7A7t1pMYZA40WitdXnjLUr6oAv8vAslV8l0RZNs7iwZJ_tQvQ5m8VepCyJYp4Yovq74P8T_ilwXo-wTei-0v4bciC"
          />
        </div>
        <div className="relative z-20 flex flex-col justify-end p-8 space-y-4">
          <div className="inline-block px-3 py-1 bg-[#00d2fd] text-[#001f27] text-xs font-bold uppercase tracking-widest self-start">
            Análise em Tempo Real
          </div>
          <h1 className="text-5xl font-bold uppercase max-w-lg leading-none">
            Domine a Arena <span className="text-[#00d2fd]">Tática</span>
          </h1>
          <p className="text-lg text-[#c1c6d7] max-w-md">
            Acompanhe o desempenho em tempo real com dados de nível
            profissional. Precisão Velocity Blue para o torcedor moderno.
          </p>
        </div>
      </section>

      {/* Coluna Direita: Formulário de Login */}
      <main className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-8 bg-[#111317] relative z-10">
        <div className="w-full max-w-md space-y-8">
          {/* Logo & Cabeçalho */}
          <div className="text-center lg:text-left space-y-2">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
              <span
                className="material-symbols-outlined text-[#00d2fd] text-4xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                sports_soccer
              </span>
              <span className="text-2xl font-bold text-[#e2e2e8] tracking-tight uppercase">
                Smart Football Hub
              </span>
            </div>
            <h2 className="text-2xl font-semibold text-[#e2e2e8]">
              Bem-vindo de volta, Scout
            </h2>
            <p className="text-sm text-[#c1c6d7]">
              Insira suas credenciais para acessar o painel.
            </p>
          </div>

          {/* Card de Login */}
          <div className="bg-[#1e2024] border border-[#414755] p-8 space-y-6 relative">
            {/* Linha de Destaque Superior */}
            <div className="absolute top-0 left-0 w-16 h-1 bg-[#00d2fd]"></div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Campo de Email */}
              <div className="space-y-2">
                <label
                  className="text-xs font-bold text-[#c1c6d7] uppercase tracking-wider"
                  htmlFor="email"
                >
                  Endereço de E-mail
                </label>
                <div className="relative">
                  <span
                    className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg transition-colors duration-200 ${
                      isEmailFocused ? "text-[#00d2fd]" : "text-[#414755]"
                    }`}
                  >
                    mail
                  </span>
                  <input
                    className="w-full bg-[#1a1c20] border border-[#414755] py-3 pl-10 pr-4 text-[#e2e2e8] placeholder-[#8b90a0] focus:outline-none focus:border-[#00d2fd] focus:ring-0 transition-all text-sm"
                    id="email"
                    type="email"
                    placeholder="nome@organizacao.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    required
                  />
                </div>
              </div>

              {/* Campo de Senha */}
              <div className="space-y-2">
                <label
                  className="text-xs font-bold text-[#c1c6d7] uppercase tracking-wider"
                  htmlFor="password"
                >
                  Chave de Segurança
                </label>
                <div className="relative">
                  <span
                    className={`material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lg transition-colors duration-200 ${
                      isPasswordFocused ? "text-[#00d2fd]" : "text-[#414755]"
                    }`}
                  >
                    lock
                  </span>
                  <input
                    className="w-full bg-[#1a1c20] border border-[#414755] py-3 pl-10 pr-12 text-[#e2e2e8] placeholder-[#8b90a0] focus:outline-none focus:border-[#00d2fd] focus:ring-0 transition-all text-sm"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#414755] hover:text-[#00d2fd] transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Opções (Lembrar-me & Esqueceu a senha) */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 bg-[#1a1c20] border-[#414755] text-[#00d2fd] focus:ring-0 focus:ring-offset-0 rounded-none cursor-pointer"
                  />
                  <span className="text-[#c1c6d7] group-hover:text-[#e2e2e8] transition-colors select-none">
                    Lembrar dispositivo
                  </span>
                </label>
                <a
                  href="#"
                  className="text-[#00d2fd] hover:underline decoration-2 underline-offset-4 transition-all"
                >
                  Esqueceu a Senha?
                </a>
              </div>

              {/* Botão de Envio */}
              <button
                type="submit"
                className="w-full py-4 bg-[#4b8eff] hover:bg-[#00d2fd] text-[#001a41] text-xs font-bold uppercase tracking-[0.2em] transition-all duration-200 active:scale-[0.98]"
              >
                Autorizar Sessão
              </button>
            </form>

            {/* Divisor */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-[#414755]/30"></div>
              <span className="flex-shrink mx-4 text-[10px] text-[#414755] uppercase tracking-widest font-bold">
                OU CONECTE VIA
              </span>
              <div className="flex-grow border-t border-[#414755]/30"></div>
            </div>

            {/* Logins Sociais */}
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 py-3 border border-[#414755] hover:bg-[#282a2e] hover:border-[#8b90a0] transition-all active:scale-[0.98]">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.92,19.27 6.06,17.15 4.97,14.22C4.34,12.55 4.34,10.74 4.97,9.07C6.06,6.14 8.92,4.02 12.19,4.02C14.39,4.02 16.39,4.83 17.91,6.33L20,4.24C17.88,2.22 15.1,1.1 12.19,1.1C6.7,1.1 2.2,5.6 2.2,11.1C2.2,16.6 6.7,21.1 12.19,21.1C17.68,21.1 21.82,17.1 21.82,11.1C21.82,10.5 21.75,10 21.35,11.1Z"
                    fill="currentColor"
                  ></path>
                </svg>
                <span className="text-xs font-bold uppercase tracking-wider">
                  Google
                </span>
              </button>
              <button className="flex items-center justify-center gap-2 py-3 border border-[#414755] hover:bg-[#282a2e] hover:border-[#8b90a0] transition-all active:scale-[0.98]">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"
                    fill="currentColor"
                  ></path>
                </svg>
                <span className="text-xs font-bold uppercase tracking-wider">
                  Apple
                </span>
              </button>
            </div>
          </div>

          {/* Link para Alternar para Registro */}
          <div className="text-center space-y-4">
            <p className="text-sm text-[#c1c6d7]">
              Novo na plataforma?{" "}
              <button
                onClick={onSwitchToRegister}
                className="text-[#00d2fd] hover:underline font-bold decoration-2 underline-offset-4 transition-all"
              >
                Solicitar Matrícula
              </button>
            </p>
            <div className="flex justify-center gap-6 opacity-40 text-[10px]">
              <a
                href="#"
                className="hover:text-[#e2e2e8] uppercase tracking-wider font-bold"
              >
                Legal
              </a>
              <a
                href="#"
                className="hover:text-[#e2e2e8] uppercase tracking-wider font-bold"
              >
                Privacidade
              </a>
              <a
                href="#"
                className="hover:text-[#e2e2e8] uppercase tracking-wider font-bold"
              >
                Segurança
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Decorações Visuais de Fundo (Efeitos de Brilho) */}
      <div className="fixed top-0 right-0 p-8 z-0 pointer-events-none overflow-hidden">
        <div className="w-96 h-96 bg-[#00d2fd]/5 rounded-full blur-[100px] -mr-48 -mt-48"></div>
      </div>
      <div className="fixed bottom-0 left-0 p-8 z-0 pointer-events-none overflow-hidden">
        <div className="w-64 h-64 bg-[#4b8eff]/5 rounded-full blur-[80px] -ml-32 -mb-32"></div>
      </div>
    </div>
  );
}
