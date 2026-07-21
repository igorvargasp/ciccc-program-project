import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { authClient } from "../../auth";

interface RegisterPageProps {
  onSwitchToLogin?: () => void;
  onOpenTerms?: () => void;
  onSuccessRegister?: () => void; // Prop opcional para evitar crash
}

interface AppFeature {
  name: string;
  description: string;
  icon: string;
  tag: string;
}

const appFeatures: AppFeature[] = [
  {
    name: "Tactical Analysis",
    description:
      "Real-time heatmaps and formation shifts powered by neural networks.",
    icon: "psychology",
    tag: "Tactics",
  },
  {
    name: "Transfer Advisor",
    description:
      "Predictive market value modeling and scout-grade comparison tools.",
    icon: "trending_up",
    tag: "Market",
  },
  {
    name: "Scouting Radar",
    description:
      "Identify global hidden talents using advanced algorithmic filters.",
    icon: "radar",
    tag: "Scouting",
  },
  {
    name: "Personalized Hub",
    description:
      "Favorite team selection and custom dashboard tailored to your football passions.",
    icon: "dashboard",
    tag: "Dashboard",
  },
  {
    name: "Match Calendar",
    description:
      "Upcoming matches calendar featuring deep-dive match insights and details.",
    icon: "calendar_month",
    tag: "Fixtures",
  },
  {
    name: "Match History",
    description:
      "Historical match data and previous results breakdown from global tournaments.",
    icon: "history",
    tag: "Results",
  },
  {
    name: "League Tables",
    description:
      "Up-to-date league standings and multi-competition tables tracked instantly.",
    icon: "format_list_numbered",
    tag: "Standings",
  },
  {
    name: "Match Simulator",
    description:
      "Simulate match results with dynamic, real-time standings adjustments.",
    icon: "sports_esports",
    tag: "AI Engine",
  },
  {
    name: "Dream Lineup Builder",
    description:
      "Custom team lineup builder to configure and visualize your ultimate squad tactical board.",
    icon: "assignment",
    tag: "Tactics",
  },
  {
    name: "Dual Theme Engine",
    description:
      "Full Dark and Light mode interface support optimized for daylight or late-night viewing.",
    icon: "contrast",
    tag: "UI / UX",
  },
  {
    name: "Live Alerts",
    description:
      "Real-time push notifications for live matches and critical favorite team updates.",
    icon: "notifications_active",
    tag: "Alerts",
  },
  {
    name: "AI Formations",
    description:
      "Simulate matches and auto-generate counters to opponent tactical lineups.",
    icon: "grid_view",
    tag: "AI Engine",
  },
];

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSwitchToLogin,
  onOpenTerms,
  onSuccessRegister,
}) => {
  const { login } = useAuth();

  // Estados do Formulário
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados de Interface
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);

  const [activeFocus, setActiveFocus] = useState({
    firstName: false,
    surname: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const handleFocus = (field: keyof typeof activeFocus) => {
    setActiveFocus((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: keyof typeof activeFocus) => {
    setActiveFocus((prev) => ({ ...prev, [field]: false }));
  };

  const checkPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass)
      return {
        score,
        label: "Empty",
        color: "bg-transparent",
        text: "text-[#8b90a0]",
      };

    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1:
        return {
          score,
          label: "Weak",
          color: "bg-red-500",
          text: "text-red-500",
        };
      case 2:
        return {
          score,
          label: "Fair",
          color: "bg-orange-500",
          text: "text-orange-500",
        };
      case 3:
        return {
          score,
          label: "Good",
          color: "bg-yellow-500",
          text: "text-yellow-500",
        };
      case 4:
        return {
          score,
          label: "Strong",
          color: "bg-[#00d2fd]",
          text: "text-[#00d2fd]",
        };
      default:
        return {
          score,
          label: "Very Weak",
          color: "bg-red-600",
          text: "text-red-600",
        };
    }
  };

  const passwordStrength = checkPasswordStrength(password);

  const prevFeature = () => {
    setCurrentFeature((prev) =>
      prev === 0 ? appFeatures.length - 1 : prev - 1,
    );
  };

  const nextFeature = () => {
    setCurrentFeature((prev) =>
      prev === appFeatures.length - 1 ? 0 : prev + 1,
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !surname || !email || !password || !confirmPassword) {
      alert("Please fill in all fields.");
      return;
    }
    if (passwordStrength.score < 3) {
      alert(
        "Please create a stronger password (must include uppercase, number, or special character).",
      );
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    if (!agreeTerms) {
      alert("You must agree to the Terms of Protocol.");
      return;
    }

    setIsSubmitting(true);

    try {
      const fullName = `${firstName} ${surname}`.trim();

      const signUpRes = await authClient.signUp.email({
        email,
        password,
        name: fullName,
      });

      if (signUpRes.error) {
        throw new Error(signUpRes.error.message || "Sign up failed.");
      }

      // Salva a sessão localmente
      login(email, fullName);

      // Execução 100% segura sem lançar exceção caso a prop não venha
      if (onSuccessRegister) {
        onSuccessRegister();
      } else if (onSwitchToLogin) {
        onSwitchToLogin();
      }
    } catch (error: unknown) {
      console.error("Registration error:", error);

      // Ignora o erro se for apenas um glitch do callback
      const message =
        error instanceof Error
          ? error.message
          : "An error occurred during registration.";

      if (!message.includes("onSuccessRegister")) {
        alert(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen text-[#e2e2e8] flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-['Archivo_Narrow']"
      style={{
        background:
          "radial-gradient(circle, #051429 0%, #0d0f13 60%, #000000 100%)",
      }}
    >
      <header className="fixed top-0 left-0 w-full h-20 flex items-center justify-between px-6 md:px-8 z-50 bg-[#111317]/80 backdrop-blur-md border-b border-[#414755]/30">
        <div className="h-14 flex items-center">
          <img
            src="/aliscorelogo.png"
            alt="Ali Score Logo"
            className="h-full w-auto object-contain"
          />
        </div>

        <div className="flex items-center gap-4 relative z-50">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#414755] bg-[#1a1c20]/50 hover:bg-[#1a1c20] text-[#c1c6d7] hover:text-[#00d2fd] hover:border-[#00d2fd] transition-all duration-300 text-xs font-bold uppercase tracking-wider cursor-pointer"
            onClick={() => alert("Language toggle clicked!")}
          >
            <span className="material-symbols-outlined text-[16px]">
              translate
            </span>
            EN / PT
          </button>

          <button
            type="button"
            className="p-2 border border-[#414755] bg-[#1a1c20]/50 hover:bg-[#1a1c20] text-[#c1c6d7] hover:text-[#00d2fd] hover:border-[#00d2fd] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
            onClick={() => alert("Theme toggle clicked!")}
            aria-label="Toggle Theme"
          >
            <span className="material-symbols-outlined text-[18px]">
              dark_mode
            </span>
          </button>
        </div>
      </header>

      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 mt-24 relative z-10">
        {/* Carrossel da Esquerda */}
        <section className="lg:col-span-5 hidden lg:flex flex-col justify-center space-y-4 pr-4">
          <div className="space-y-3">
            <h1 className="text-5xl font-bold text-[#e2e2e8] leading-none tracking-tight">
              PREDICT THE <br />
              <span className="text-[#00d2fd]">UNPREDICTED.</span>
            </h1>
            <p className="text-base text-[#c1c6d7] max-w-md font-normal leading-relaxed">
              Join the world's most advanced football intelligence platform.
            </p>
          </div>

          <div className="relative flex items-center justify-center w-full h-[320px] gap-2">
            <button
              type="button"
              onClick={prevFeature}
              className="z-30 p-2 rounded-full border border-[#414755] bg-[#1a1c20]/80 hover:bg-[#1a1c20] text-[#e2e2e8] hover:text-[#00d2fd] transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[24px]">
                chevron_left
              </span>
            </button>

            <div className="relative w-full h-full flex items-center justify-center overflow-hidden [perspective:1000px]">
              {appFeatures.map((feature, index) => {
                const offset =
                  (index - currentFeature + appFeatures.length) %
                  appFeatures.length;
                let adjustedOffset = offset;
                if (offset > appFeatures.length / 2)
                  adjustedOffset = offset - appFeatures.length;
                const isActive = adjustedOffset === 0;

                return (
                  <div
                    key={feature.name}
                    className={`absolute w-[220px] h-[260px] p-6 flex flex-col items-center justify-between border transition-all duration-500 ease-out ${
                      isActive
                        ? "bg-[#1e2024] border-[#00d2fd] shadow-[0_0_30px_rgba(0,210,253,0.25)]"
                        : "bg-[#111317]/60 border-[#414755]/40"
                    }`}
                    style={{
                      transform: `translateX(${adjustedOffset * 150}px) scale(${
                        isActive ? 1 : 0.75
                      }) rotateY(${adjustedOffset * 30}deg)`,
                      opacity: Math.abs(adjustedOffset) > 1 ? 0 : 1,
                      zIndex: 10 - Math.abs(adjustedOffset),
                      filter: isActive ? "none" : "blur(1px) brightness(0.4)",
                      pointerEvents: isActive ? "auto" : "none",
                    }}
                  >
                    <div
                      className={`p-4 flex items-center justify-center rounded-none transition-colors duration-300 ${
                        isActive
                          ? "bg-[#00d2fd]/15 text-[#00d2fd]"
                          : "bg-[#414755]/10 text-[#8b90a0]"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[36px]">
                        {feature.icon}
                      </span>
                    </div>

                    <div className="text-center flex-1 flex flex-col justify-center mt-3">
                      <h3
                        className={`text-lg font-bold tracking-tight mb-1 uppercase ${
                          isActive ? "text-[#e2e2e8]" : "text-[#8b90a0]"
                        }`}
                      >
                        {feature.name}
                      </h3>
                      <p
                        className={`text-[11px] leading-relaxed ${
                          isActive
                            ? "text-[#c1c6d7] opacity-100"
                            : "text-[#8b90a0]/60 opacity-0"
                        }`}
                      >
                        {feature.description}
                      </p>
                    </div>

                    {isActive && (
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 bg-[#00d2fd]/10 text-[#00d2fd] border border-[#00d2fd]/30">
                        {feature.tag}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={nextFeature}
              className="z-30 p-2 rounded-full border border-[#414755] bg-[#1a1c20]/80 hover:bg-[#1a1c20] text-[#e2e2e8] hover:text-[#00d2fd] transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[24px]">
                chevron_right
              </span>
            </button>
          </div>
        </section>

        {/* Formulário de Registro Directo */}
        <section className="lg:col-span-7 flex items-center justify-center">
          <div className="w-full max-w-xl bg-[#1e2024] border border-[#414755] p-8 md:p-10 shadow-2xl relative z-20">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00d2fd] via-[#4b8eff] to-transparent"></div>
            <div className="mb-8">
              <div className="text-[12px] font-bold tracking-widest text-[#00d2fd] mb-2 uppercase">
                SYSTEM ACCESS
              </div>
              <h2 className="text-2xl font-semibold text-[#e2e2e8] uppercase">
                CREATE ACCOUNT
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    className={`text-[12px] font-bold tracking-widest transition-colors ${
                      activeFocus.firstName
                        ? "text-[#00d2fd]"
                        : "text-[#c1c6d7]"
                    }`}
                  >
                    FIRST NAME
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[20px]">
                      person
                    </span>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onFocus={() => handleFocus("firstName")}
                      onBlur={() => handleBlur("firstName")}
                      placeholder="Enter your first name"
                      className="w-full bg-[#0c0e12] border border-[#414755] py-3 pl-10 pr-4 text-sm text-[#e2e2e8] focus:outline-none focus:border-[#00d2fd]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className={`text-[12px] font-bold tracking-widest transition-colors ${
                      activeFocus.surname ? "text-[#00d2fd]" : "text-[#c1c6d7]"
                    }`}
                  >
                    SURNAME
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[20px]">
                      badge
                    </span>
                    <input
                      type="text"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      onFocus={() => handleFocus("surname")}
                      onBlur={() => handleBlur("surname")}
                      placeholder="Enter your surname"
                      className="w-full bg-[#0c0e12] border border-[#414755] py-3 pl-10 pr-4 text-sm text-[#e2e2e8] focus:outline-none focus:border-[#00d2fd]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className={`text-[12px] font-bold tracking-widest transition-colors ${
                    activeFocus.email ? "text-[#00d2fd]" : "text-[#c1c6d7]"
                  }`}
                >
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[20px]">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => handleFocus("email")}
                    onBlur={() => handleBlur("email")}
                    placeholder="name@domain.com"
                    className="w-full bg-[#0c0e12] border border-[#414755] py-3 pl-10 pr-4 text-sm text-[#e2e2e8] focus:outline-none focus:border-[#00d2fd]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    className={`text-[12px] font-bold tracking-widest transition-colors ${
                      activeFocus.password ? "text-[#00d2fd]" : "text-[#c1c6d7]"
                    }`}
                  >
                    PASSWORD
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[20px]">
                      lock
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => handleFocus("password")}
                      onBlur={() => handleBlur("password")}
                      placeholder="••••••••"
                      className="w-full bg-[#0c0e12] border border-[#414755] py-3 pl-10 pr-10 text-sm text-[#e2e2e8] focus:outline-none focus:border-[#00d2fd]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b90a0] hover:text-[#00d2fd]"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>

                  {password && (
                    <div className="pt-1 space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-bold tracking-wider uppercase">
                        <span className="text-[#8b90a0]">Security Level:</span>
                        <span className={passwordStrength.text}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-[#0c0e12] border border-[#414755]/40 flex gap-0.5 p-[1px]">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-full flex-1 transition-all duration-500 ${
                              step <= passwordStrength.score
                                ? passwordStrength.color
                                : "bg-transparent"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    className={`text-[12px] font-bold tracking-widest transition-colors ${
                      activeFocus.confirmPassword
                        ? "text-[#00d2fd]"
                        : "text-[#c1c6d7]"
                    }`}
                  >
                    CONFIRM
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[20px]">
                      verified_user
                    </span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => handleFocus("confirmPassword")}
                      onBlur={() => handleBlur("confirmPassword")}
                      placeholder="••••••••"
                      className="w-full bg-[#0c0e12] border border-[#414755] py-3 pl-10 pr-10 text-sm text-[#e2e2e8] focus:outline-none focus:border-[#00d2fd]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b90a0] hover:text-[#00d2fd]"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showConfirmPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-5 h-5 bg-[#0c0e12] border-[#414755] text-[#4b8eff]"
                  required
                />
                <span className="text-sm text-[#c1c6d7] group-hover:text-[#e2e2e8]">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={onOpenTerms}
                    className="text-[#00d2fd] underline hover:text-[#4b8eff] font-bold"
                  >
                    Terms of Protocol
                  </button>{" "}
                  and Privacy Policy.
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#4b8eff] text-[#00285c] font-bold py-4 mt-4 tracking-widest text-lg hover:bg-[#00d2fd] transition-all disabled:opacity-50 cursor-pointer uppercase"
              >
                {isSubmitting ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-[#c1c6d7]">
                ALREADY A MEMBER?{" "}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-[#00d2fd] hover:underline font-bold ml-1"
                >
                  LOG IN
                </button>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
