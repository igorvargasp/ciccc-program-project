import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { RegisterCardHeader } from "./Register&LoginCardHeader";
import { useAppStore } from "@/store/app";
import { useTranslation } from "react-i18next";

interface LoginCardProps {
  onSwitchToRegister: () => void;
}

export function LoginCard({ onSwitchToRegister }: LoginCardProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme } = useAppStore();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Novo estado profissional para gerenciar mensagens de erro inline
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage(
        t("login.alertEmptyFields", "Please enter both email and password."),
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate("/home");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t(
              "login.alertInvalidCredentials",
              "Invalid credentials. Please verify your access key.",
            );
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`flex flex-col min-h-screen w-full transition-colors duration-300 ${
        isDark ? "bg-[#0d0f12] text-[#e2e2e8]" : "bg-gray-50 text-gray-900"
      } selection:bg-[#00d2fd]/30 selection:text-[#00d2fd]`}
    >
      <RegisterCardHeader />

      <div className="flex flex-1 w-full pt-20">
        {/* LEFT COLUMN: Immersive Cinematic Hero Panel (Desktop Only) */}
        <section
          className={`hidden lg:flex lg:w-1/2 relative overflow-hidden border-r ${
            isDark
              ? "bg-[#07090c] border-[#414755]/20"
              : "bg-gray-50 border-gray-200"
          }`}
        >
          <div
            className={`absolute inset-0 z-10 bg-gradient-to-t ${
              isDark
                ? "from-[#0d0f12] via-[#0d0f12]/40"
                : "from-gray-50 via-gray-50/40"
            } to-transparent`}
          ></div>
          <div
            className={`absolute inset-0 z-10 bg-gradient-to-r from-transparent ${
              isDark ? "to-[#0d0f12]" : "to-gray-50"
            }`}
          ></div>

          {/* Local Video Background Layer */}
          <div className="absolute inset-0 z-0 opacity-35 mix-blend-screen scale-125 pointer-events-none select-none">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover aspect-video translate-x-36 translate-y-6"
              style={{
                height: "70%",
                width: "100%",
              }}
            >
              <source src="/sloganaliscore.mp4" type="video/mp4" />
              Your browser does not support video tags.
            </video>
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
          <div
            className={`relative z-20 flex flex-col justify-end p-12 space-y-6 xl:p-16 ${isDark ? "text-[#e2e2e8]" : "text-gray-900"}`}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#00d2fd]/10 border border-[#00d2fd]/30 text-[#00d2fd] text-xs font-bold uppercase tracking-widest self-start backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-[#00d2fd] animate-pulse rounded-full"></span>
              ALI SCORE
            </div>
            <h1 className="text-5xl xl:text-6xl font-extrabold uppercase max-w-lg leading-[0.95] tracking-tight">
              {t("login.heroTitlePart1", "PREDICT THE")} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d2fd] to-[#4b8eff]">
                {t("login.heroTitlePart2", "UNPREDICTED")}
              </span>
            </h1>
            <p
              className={`text-base max-w-md font-normal leading-relaxed ${isDark ? "text-[#c1c6d7]" : "text-gray-600"}`}
            >
              {t(
                "login.heroDescription",
                "Predict outcomes and decipher squad telemetry through deep-learning algorithmic filters and advanced sports data architectures.",
              )}
            </p>
          </div>
        </section>

        {/* RIGHT COLUMN: Minimalist High-Fidelity Login Interface */}
        <main
          className={`w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 xl:p-16 relative z-10 transition-colors ${
            isDark ? "bg-[#0d0f12]" : "bg-white"
          }`}
        >
          <div className="w-full max-w-xl space-y-8">
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
                <h2
                  className={`text-2xl font-bold uppercase tracking-tight ${
                    isDark ? "text-[#e2e2e8]" : "text-gray-900"
                  }`}
                >
                  {t("login.welcomeBack", "Welcome Back!")}
                </h2>
                <p
                  className={`text-sm mt-1 ${isDark ? "text-[#8b90a0]" : "text-gray-500"}`}
                >
                  {t(
                    "login.securitySubtitle",
                    "Provide your security credentials to access the central console.",
                  )}
                </p>
              </div>
            </div>

            <div
              className={`border p-8 space-y-6 relative shadow-2xl transition-all duration-300 ${
                isDark
                  ? "bg-[#14171c] border-[#414755]/30 hover:border-[#414755]/60"
                  : "bg-white border-gray-200 hover:border-gray-300 shadow-xl"
              }`}
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00d2fd] via-[#4b8eff] to-transparent"></div>

              {/* Banner de Erro Inline Profissional (Substitui o alert nativo) */}
              {errorMessage && (
                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs tracking-wide animate-fadeIn">
                  <span className="material-symbols-outlined text-base mt-0.5 shrink-0">
                    error
                  </span>
                  <div className="flex-1 font-medium">{errorMessage}</div>
                  <button
                    onClick={() => setErrorMessage(null)}
                    className="text-red-400/70 hover:text-red-400 transition-colors"
                    aria-label="Dismiss error"
                  >
                    <span className="material-symbols-outlined text-sm">
                      close
                    </span>
                  </button>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div className="space-y-2 group">
                  <label
                    className={`text-[11px] font-bold uppercase tracking-widest transition-colors duration-200 block ${
                      isDark ? "text-[#8b90a0]" : "text-gray-600"
                    }`}
                    htmlFor="email"
                  >
                    {t("login.emailLabel", "Email Address")}
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-[#414755] group-focus-within:text-[#00d2fd] transition-colors duration-200 pointer-events-none select-none">
                      mail
                    </span>
                    <input
                      className={`w-full border py-3.5 pl-11 pr-4 focus:outline-none focus:border-[#00d2fd] focus:ring-1 focus:ring-[#00d2fd]/20 transition-all text-sm rounded-none tracking-wide ${
                        isDark
                          ? "bg-[#0d0f12] border-[#414755]/40 text-[#e2e2e8] placeholder-[#8b90a0]/30"
                          : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"
                      }`}
                      id="email"
                      type="email"
                      placeholder="operator@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <label
                    className={`text-[11px] font-bold uppercase tracking-widest transition-colors duration-200 block ${
                      isDark ? "text-[#8b90a0]" : "text-gray-600"
                    }`}
                    htmlFor="password"
                  >
                    {t("login.passwordLabel", "Password")}
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-[#414755] group-focus-within:text-[#00d2fd] transition-colors duration-200 pointer-events-none select-none">
                      lock
                    </span>
                    <input
                      className={`w-full border py-3.5 pl-11 pr-12 focus:outline-none focus:border-[#00d2fd] focus:ring-1 focus:ring-[#00d2fd]/20 transition-all text-sm rounded-none tracking-wide ${
                        isDark
                          ? "bg-[#0d0f12] border-[#414755]/40 text-[#e2e2e8] placeholder-[#8b90a0]/30"
                          : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"
                      }`}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
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

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 bg-[#0d0f12] border-[#414755]/60 text-[#00d2fd] focus:ring-0 focus:ring-offset-0 rounded-none cursor-pointer"
                    />
                    <span
                      className={`transition-colors select-none font-medium ${isDark ? "text-[#8b90a0] group-hover:text-[#e2e2e8]" : "text-gray-600 group-hover:text-gray-900"}`}
                    >
                      {t(
                        "login.rememberWorkstation",
                        "Remember this workstation",
                      )}
                    </span>
                  </label>
                  <a
                    href="#"
                    className="text-[#8b90a0] hover:text-[#00d2fd] font-bold uppercase tracking-wider text-[10px] transition-colors"
                  >
                    {t("login.recoverKey", "Recover Key?")}
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-[#4b8eff] hover:bg-[#00d2fd] disabled:opacity-50 text-[#001a41] text-xs font-black uppercase tracking-[0.25em] transition-all duration-300 active:scale-[0.99] shadow-lg shadow-[#4b8eff]/10 hover:shadow-[#00d2fd]/20 border border-transparent hover:border-white/10 cursor-pointer mt-2 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#001a41] border-t-transparent"></span>
                      {t("login.authorizing", "Authorizing...")}
                    </>
                  ) : (
                    t("login.authorizeSession", "Authorize Session")
                  )}
                </button>
              </form>

              <div className="relative flex items-center py-1.5">
                <div className="flex-grow border-t border-[#414755]/15"></div>
                <span className="flex-shrink mx-4 text-[9px] text-[#414755] uppercase tracking-[0.3em] font-extrabold select-none">
                  {t("login.identityProvider", "Identity Provider")}
                </span>
                <div className="flex-grow border-t border-[#414755]/15"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  className={`flex items-center justify-center gap-2.5 py-3 border transition-all active:scale-[0.98] rounded-none cursor-pointer text-xs font-bold uppercase tracking-widest ${
                    isDark
                      ? "border-[#414755]/40 hover:bg-[#1a1c22] hover:border-[#8b90a0]/60 text-[#c1c6d7] hover:text-[#e2e2e8]"
                      : "border-gray-300 hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.92,19.27 6.06,17.15 4.97,14.22C4.34,12.55 4.34,10.74 4.97,9.07C6.06,6.14 8.92,4.02 12.19,4.02C14.39,4.02 16.39,4.83 17.91,6.33L20,4.24C17.88,2.22 15.1,1.1 12.19,1.1C6.7,1.1 2.2,5.6 2.2,11.1C2.2,16.6 6.7,21.1 12.19,21.1C17.68,21.1 21.82,17.1 21.82,11.1C21.82,10.5 21.75,10 21.35,11.1Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                  Google
                </button>
                <button
                  className={`flex items-center justify-center gap-2.5 py-3 border transition-all active:scale-[0.98] rounded-none cursor-pointer text-xs font-bold uppercase tracking-widest ${
                    isDark
                      ? "border-[#414755]/40 hover:bg-[#1a1c22] hover:border-[#8b90a0]/60 text-[#c1c6d7] hover:text-[#e2e2e8]"
                      : "border-gray-300 hover:bg-gray-100 text-gray-700"
                  }`}
                >
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

            <div className="text-center space-y-5">
              <p
                className={`text-sm ${isDark ? "text-[#8b90a0]" : "text-gray-600"}`}
              >
                {t("login.newToPlatform", "New to the platform?")}{" "}
                <button
                  onClick={onSwitchToRegister}
                  className="text-[#00d2fd] hover:text-[#4b8eff] font-bold uppercase text-xs tracking-wider transition-colors ml-1 cursor-pointer"
                >
                  {t("login.requestRegistration", "Request Registration")}
                </button>
              </p>
              <div
                className={`flex justify-center gap-6 opacity-30 text-[10px] font-bold uppercase tracking-widest select-none ${isDark ? "text-white" : "text-gray-900"}`}
              >
                <a href="#" className="hover:opacity-100 transition-all">
                  {t("login.legalDetails", "Legal Details")}
                </a>
                <a href="#" className="hover:opacity-100 transition-all">
                  {t("login.privacyNode", "Privacy Node")}
                </a>
                <a href="#" className="hover:opacity-100 transition-all">
                  {t("login.securityStandard", "Security Standard")}
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>

      <div className="fixed top-0 right-0 p-8 z-0 pointer-events-none overflow-hidden select-none">
        <div className="w-96 h-96 bg-[#00d2fd]/5 rounded-full blur-[120px] -mr-48 -mt-48"></div>
      </div>
      <div className="fixed bottom-0 left-0 p-8 z-0 pointer-events-none overflow-hidden select-none">
        <div className="w-80 h-80 bg-[#4b8eff]/3 rounded-full blur-[100px] -ml-40 -mb-40"></div>
      </div>
    </div>
  );
}
