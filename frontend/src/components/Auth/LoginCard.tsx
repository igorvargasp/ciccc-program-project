import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";

interface LoginCardProps {
  onSwitchToRegister: () => void;
}

export function LoginCard({ onSwitchToRegister }: LoginCardProps) {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Referência para o player do YouTube e ID do container
  const playerRef = useRef<any>(null);
  const containerId = "youtube-background-player";

  useEffect(() => {
    // Inicializa o player quando a API do YouTube estiver pronta
    (window as any).onYouTubeIframeAPIReady = () => {
      playerRef.current = new (window as any).YT.Player(containerId, {
        videoId: "Y1VNMJAoPeQ",
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          showinfo: 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          playsinline: 1,
          disablekb: 1,
        },
        events: {
          onReady: (event: any) => {
            event.target.playVideo();
            startLoopCheck(event.target);
          },
          onStateChange: (event: any) => {
            if (event.data === (window as any).YT.PlayerState.ENDED) {
              event.target.seekTo(0);
              event.target.playVideo();
            }
          },
        },
      });
    };

    // Injeta o script da API do YouTube de forma assíncrona
    if (!document.getElementById("youtube-api-script")) {
      const tag = document.createElement("script");
      tag.id = "youtube-api-script";
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    } else if ((window as any).YT && (window as any).YT.Player) {
      (window as any).onYouTubeIframeAPIReady();
    }

    function startLoopCheck(player: any) {
      const checkInterval = setInterval(() => {
        if (player && typeof player.getCurrentTime === "function") {
          const currentTime = player.getCurrentTime();
          const duration = player.getDuration();

          if (duration > 0 && currentTime >= duration - 1.5) {
            player.seekTo(0);
          }
        }
      }, 500);

      return () => clearInterval(checkInterval);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Chama o método de login do seu contexto de autenticação
      await login(email, password);
    } catch (error: unknown) {
      console.error("Login error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Invalid credentials. Please try again.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0d0f12] w-full font-['Archivo_Narrow'] text-[#e2e2e8] selection:bg-[#00d2fd]/30 selection:text-[#00d2fd]">
      {/* LEFT COLUMN: Immersive Cinematic Hero Panel (Desktop Only) */}
      <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#07090c] border-r border-[#414755]/20">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0d0f12] via-[#0d0f12]/40 to-transparent"></div>
        <div className="absolute inset-0 z-10 bg-gradient-to-r from-transparent to-[#0d0f12]"></div>

        {/* YouTube Video Background Layer Controlled via API */}
        <div className="absolute inset-0 z-0 opacity-25 mix-blend-screen scale-110 pointer-events-none select-none">
          <div
            id={containerId}
            className="w-full h-full object-cover aspect-video"
            style={{
              height: "110%",
              width: "100%",
              transform: "translateY(-5%)",
            }}
          />
        </div>

        {/* Matrix Tech Grid Overlay */}
        <div
          className="absolute inset-0 z-10 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#00d2fd 1px, transparent 1px), linear-gradient(90deg, #00d2fd 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        ></div>

        {/* Hero Copy Content */}
        <div className="relative z-20 flex flex-col justify-end p-12 space-y-6 xl:p-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00d2fd]/10 border border-[#00d2fd]/30 text-[#00d2fd] text-xs font-bold uppercase tracking-widest self-start backdrop-blur-sm">
            <span className="w-1.5 h-1.5 bg-[#00d2fd] animate-pulse rounded-full"></span>
            ALI SCORE
          </div>
          <h1 className="text-5xl xl:text-6xl font-extrabold uppercase max-w-lg leading-[0.95] tracking-tight">
            PREDICT THE <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d2fd] to-[#4b8eff]">
              UNPREDICTED
            </span>
          </h1>
          <p className="text-base text-[#c1c6d7] max-w-md font-normal leading-relaxed">
            Predict outcomes and decipher squad telemetry through deep-learning
            algorithmic filters and advanced sports data architectures.
          </p>
        </div>
      </section>

      {/* RIGHT COLUMN: Minimalist High-Fidelity Login Interface */}
      <main className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 xl:p-16 bg-[#0d0f12] relative z-10">
        <div className="w-full max-w-xl space-y-8">
          {/* Platform Identity & Header */}
          <div className="text-center lg:text-left space-y-3">
            <div className="flex items-center justify-center lg:justify-start gap-2.5 mb-2">
              <span
                className="material-symbols-outlined text-[#00d2fd] text-4xl transform -rotate-12 transition-transform hover:rotate-0 duration-300"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                sports_soccer
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#e2e2e8] uppercase tracking-tight">
                Welcome Back!
              </h2>
              <p className="text-sm text-[#8b90a0] mt-1">
                Provide your security credentials to access the central console.
              </p>
            </div>
          </div>

          {/* Core Authorization Container */}
          <div className="bg-[#14171c] border border-[#414755]/30 p-8 space-y-6 relative shadow-2xl transition-all duration-300 hover:border-[#414755]/60">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00d2fd] via-[#4b8eff] to-transparent"></div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email Address Input */}
              <div className="space-y-2 group">
                <label
                  className="text-[11px] font-bold text-[#8b90a0] group-focus-within:text-[#00d2fd] uppercase tracking-widest transition-colors duration-200 block"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-[#414755] group-focus-within:text-[#00d2fd] transition-colors duration-200 pointer-events-none select-none">
                    mail
                  </span>
                  <input
                    className="w-full bg-[#0d0f12] border border-[#414755]/40 py-3.5 pl-11 pr-4 text-[#e2e2e8] placeholder-[#8b90a0]/30 focus:outline-none focus:border-[#00d2fd] focus:ring-1 focus:ring-[#00d2fd]/20 transition-all text-sm rounded-none tracking-wide"
                    id="email"
                    type="email"
                    placeholder="operator@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2 group">
                <label
                  className="text-[11px] font-bold text-[#8b90a0] group-focus-within:text-[#00d2fd] uppercase tracking-widest transition-colors duration-200 block"
                  htmlFor="password"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-[#414755] group-focus-within:text-[#00d2fd] transition-colors duration-200 pointer-events-none select-none">
                    lock
                  </span>
                  <input
                    className="w-full bg-[#0d0f12] border border-[#414755]/40 py-3.5 pl-11 pr-12 text-[#e2e2e8] placeholder-[#8b90a0]/30 focus:outline-none focus:border-[#00d2fd] focus:ring-1 focus:ring-[#00d2fd]/20 transition-all text-sm rounded-none tracking-wide"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#414755] hover:text-[#00d2fd] transition-colors flex items-center justify-center p-1"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Auxiliary Controls */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 bg-[#0d0f12] border-[#414755]/60 text-[#00d2fd] focus:ring-0 focus:ring-offset-0 rounded-none cursor-pointer dynamic-checkbox"
                  />
                  <span className="text-[#8b90a0] group-hover:text-[#e2e2e8] transition-colors select-none font-medium">
                    Remember this workstation
                  </span>
                </label>
                <a
                  href="#"
                  className="text-[#8b90a0] hover:text-[#00d2fd] font-bold uppercase tracking-wider text-[10px] transition-colors"
                >
                  Recover Key?
                </a>
              </div>

              {/* Action Form Submission Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#4b8eff] hover:bg-[#00d2fd] disabled:opacity-50 text-[#001a41] text-xs font-black uppercase tracking-[0.25em] transition-all duration-300 active:scale-[0.99] shadow-lg shadow-[#4b8eff]/10 hover:shadow-[#00d2fd]/20 border border-transparent hover:border-white/10 cursor-pointer mt-2 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#001a41] border-t-transparent"></span>
                    Authorizing...
                  </>
                ) : (
                  "Authorize Session"
                )}
              </button>
            </form>

            {/* Visual Text Divider */}
            <div className="relative flex items-center py-1.5">
              <div className="flex-grow border-t border-[#414755]/15"></div>
              <span className="flex-shrink mx-4 text-[9px] text-[#414755] uppercase tracking-[0.3em] font-extrabold select-none">
                Identity Provider
              </span>
              <div className="flex-grow border-t border-[#414755]/15"></div>
            </div>

            {/* Federated Single Sign-On Architecture */}
            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2.5 py-3 border border-[#414755]/40 hover:bg-[#1a1c22] hover:border-[#8b90a0]/60 text-[#c1c6d7] hover:text-[#e2e2e8] transition-all active:scale-[0.98] rounded-none cursor-pointer text-xs font-bold uppercase tracking-widest">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.92,19.27 6.06,17.15 4.97,14.22C4.34,12.55 4.34,10.74 4.97,9.07C6.06,6.14 8.92,4.02 12.19,4.02C14.39,4.02 16.39,4.83 17.91,6.33L20,4.24C17.88,2.22 15.1,1.1 12.19,1.1C6.7,1.1 2.2,5.6 2.2,11.1C2.2,16.6 6.7,21.1 12.19,21.1C17.68,21.1 21.82,17.1 21.82,11.1C21.82,10.5 21.75,10 21.35,11.1Z"
                    fill="currentColor"
                  ></path>
                </svg>
                Google
              </button>
              <button className="flex items-center justify-center gap-2.5 py-3 border border-[#414755]/40 hover:bg-[#1a1c22] hover:border-[#8b90a0]/60 text-[#c1c6d7] hover:text-[#e2e2e8] transition-all active:scale-[0.98] rounded-none cursor-pointer text-xs font-bold uppercase tracking-widest">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2 16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z"
                    fill="currentColor"
                  ></path>
                </svg>
                Apple
              </button>
            </div>
          </div>

          {/* Toggle View & Legal Outro */}
          <div className="text-center space-y-5">
            <p className="text-sm text-[#8b90a0]">
              New to the platform?{" "}
              <button
                onClick={onSwitchToRegister}
                className="text-[#00d2fd] hover:text-[#4b8eff] font-bold uppercase text-xs tracking-wider transition-colors ml-1 cursor-pointer"
              >
                Request Registration
              </button>
            </p>
            <div className="flex justify-center gap-6 opacity-30 text-[10px] font-bold uppercase tracking-widest select-none">
              <a
                href="#"
                className="hover:text-[#e2e2e8] hover:opacity-100 transition-all"
              >
                Legal Details
              </a>
              <a
                href="#"
                className="hover:text-[#e2e2e8] hover:opacity-100 transition-all"
              >
                Privacy Node
              </a>
              <a
                href="#"
                className="hover:text-[#e2e2e8] hover:opacity-100 transition-all"
              >
                Security Standard
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Dynamic Blur Overlay */}
      <div className="fixed top-0 right-0 p-8 z-0 pointer-events-none overflow-hidden select-none">
        <div className="w-96 h-96 bg-[#00d2fd]/5 rounded-full blur-[120px] -mr-48 -mt-48"></div>
      </div>
      <div className="fixed bottom-0 left-0 p-8 z-0 pointer-events-none overflow-hidden select-none">
        <div className="w-80 h-80 bg-[#4b8eff]/3 rounded-full blur-[100px] -ml-40 -mb-40"></div>
      </div>
    </div>
  );
}
