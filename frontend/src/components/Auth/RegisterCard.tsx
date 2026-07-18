import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

interface RegisterPageProps {
  onSwitchToLogin: () => void;
  onOpenTerms: () => void; // Prop para abrir a página de termos
}

// Lista de Features do App para o Carrossel
const appFeatures = [
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
}) => {
  const { login } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [favoriteClub, setFavoriteClub] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Estados para alternar a visibilidade das senhas
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estado do Carrossel de Features
  const [currentFeature, setCurrentFeature] = useState(0);

  const [activeFocus, setActiveFocus] = useState({
    firstName: false,
    surname: false,
    email: false,
    password: false,
    confirmPassword: false,
    favoriteClub: false,
  });

  const handleFocus = (field: keyof typeof activeFocus) => {
    setActiveFocus((prev) => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field: keyof typeof activeFocus) => {
    setActiveFocus((prev) => ({ ...prev, [field]: false }));
  };

  // Funções de Navegação do Carrossel
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !firstName ||
      !surname ||
      !email ||
      !password ||
      !confirmPassword ||
      !favoriteClub
    ) {
      alert("Please fill in all fields.");
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

    // Concatena primeiro nome e sobrenome para enviar ao contexto de autenticação
    const fullName = `${firstName} ${surname}`.trim();
    login(email, fullName);
  };

  return (
    <div
      className="min-h-screen text-[#e2e2e8] flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-['Archivo_Narrow']"
      style={{
        background:
          "radial-gradient(circle, #051429 0%, #0d0f13 60%, #000000 100%)",
      }}
    >
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 w-full h-25 flex items-center justify-between px-8 z-50 bg-[#111317]/80 backdrop-blur-md border-b border-[#414755]/30">
        {/* Left Side: Logo */}
        <div className="h-20 flex items-center">
          <img
            src="/aliscorelogo.png"
            alt="Ali Score Logo"
            className="h-full w-auto object-contain"
          />
        </div>

        {/* Right Side: Quick Actions (Theme & Language) */}
        <div className="flex items-center gap-4 relative z-50">
          {/* Language Toggle Button */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#414755] bg-[#1a1c20]/50 hover:bg-[#1a1c20] text-[#c1c6d7] hover:text-[#00d2fd] hover:border-[#00d2fd] transition-all duration-300 text-xs font-bold uppercase tracking-wider cursor-pointer"
            onClick={() => {
              alert(
                "Language toggle clicked! Integrate your i18next hook here.",
              );
            }}
          >
            <span className="material-symbols-outlined text-[16px]">
              translate
            </span>
            EN / PT
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            className="p-2 border border-[#414755] bg-[#1a1c20]/50 hover:bg-[#1a1c20] text-[#c1c6d7] hover:text-[#00d2fd] hover:border-[#00d2fd] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
            onClick={() => {
              alert("Theme toggle clicked! Integrate your ThemeContext here.");
            }}
            aria-label="Toggle Theme"
          >
            <span className="material-symbols-outlined text-[18px]">
              dark_mode
            </span>
          </button>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 mt-16 relative z-10">
        {/* Left Side: Dynamic 3D Features Carousel */}
        <section className="lg:col-span-5 hidden lg:flex flex-col justify-center space-y-4 pr-4">
          <div className="space-y-3">
            <h1 className="text-5xl font-bold text-[#e2e2e8] leading-none tracking-tight">
              PREDICT THE <br />
              <span className="text-[#00d2fd]">UNPREDICTED.</span>
            </h1>
            <p className="text-base text-[#c1c6d7] max-w-md font-normal leading-relaxed">
              Join the world's most advanced football intelligence platform.
              Explore our core tactical capabilities below.
            </p>
          </div>

          {/* 3D CAROUSEL ZONE */}
          <div className="relative flex items-center justify-center w-full h-[320px] gap-2">
            {/* PREV BUTTON */}
            <button
              type="button"
              onClick={prevFeature}
              className="z-30 p-2 rounded-full border border-[#414755] bg-[#1a1c20]/80 hover:bg-[#1a1c20] text-[#e2e2e8] hover:text-[#00d2fd] hover:border-[#00d2fd] transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
              aria-label="Previous Feature"
            >
              <span className="material-symbols-outlined text-[24px]">
                chevron_left
              </span>
            </button>

            {/* CAROUSEL TRACK */}
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden [perspective:1000px]">
              {appFeatures.map((feature, index) => {
                const offset =
                  (index - currentFeature + appFeatures.length) %
                  appFeatures.length;
                let adjustedOffset = offset;

                if (offset > appFeatures.length / 2) {
                  adjustedOffset = offset - appFeatures.length;
                }

                const isActive = adjustedOffset === 0;

                return (
                  <div
                    key={index}
                    className={`absolute w-[220px] h-[260px] p-6 flex flex-col items-center justify-between border [transform-style:preserve-3d] transition-all duration-500 ease-out
                      ${
                        isActive
                          ? "bg-[#1e2024] border-[#00d2fd] shadow-[0_0_30px_rgba(0,210,253,0.25)]"
                          : "bg-[#111317]/60 border-[#414755]/40"
                      }`}
                    style={{
                      transform: `
                        translateX(${adjustedOffset * 150}px)
                        scale(${isActive ? 1 : 0.75})
                        rotateY(${adjustedOffset * 30}deg)
                      `,
                      opacity: Math.abs(adjustedOffset) > 1 ? 0 : 1,
                      zIndex: 10 - Math.abs(adjustedOffset),
                      filter: isActive ? "none" : "blur(1px) brightness(0.4)",
                      pointerEvents: isActive ? "auto" : "none",
                    }}
                  >
                    {/* ICON container */}
                    <div
                      className={`p-4 flex items-center justify-center rounded-none transition-colors duration-300 ${
                        isActive
                          ? "bg-[#00d2fd]/15 text-[#00d2fd]"
                          : "bg-[#414755]/10 text-[#8b90a0]"
                      }`}
                    >
                      <span
                        className="material-symbols-outlined text-[36px]"
                        style={{
                          fontVariationSettings: isActive
                            ? "'FILL' 1"
                            : "'FILL' 0",
                        }}
                      >
                        {feature.icon}
                      </span>
                    </div>

                    {/* TEXTS */}
                    <div className="text-center flex-1 flex flex-col justify-center mt-3">
                      <h3
                        className={`text-lg font-bold tracking-tight mb-1 uppercase transition-colors ${
                          isActive ? "text-[#e2e2e8]" : "text-[#8b90a0]"
                        }`}
                      >
                        {feature.name}
                      </h3>
                      <p
                        className={`text-[11px] leading-relaxed transition-opacity duration-300 ${
                          isActive
                            ? "text-[#c1c6d7] opacity-100"
                            : "text-[#8b90a0]/60 opacity-0"
                        }`}
                      >
                        {feature.description}
                      </p>
                    </div>

                    {/* ACTIVE BADGE */}
                    <div className="w-full flex justify-center">
                      <div
                        className={`h-[1px] w-12 bg-gradient-to-r from-transparent via-[#00d2fd]/40 to-transparent mb-3 ${
                          isActive ? "block" : "hidden"
                        }`}
                      ></div>
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

            {/* NEXT BUTTON */}
            <button
              type="button"
              onClick={nextFeature}
              className="z-30 p-2 rounded-full border border-[#414755] bg-[#1a1c20]/80 hover:bg-[#1a1c20] text-[#e2e2e8] hover:text-[#00d2fd] hover:border-[#00d2fd] transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
              aria-label="Next Feature"
            >
              <span className="material-symbols-outlined text-[24px]">
                chevron_right
              </span>
            </button>
          </div>
        </section>

        {/* Right Side: Registration Form */}
        <section className="lg:col-span-7 flex items-center justify-center">
          {/* max-w-xl fornece o tamanho ideal expandido lateralmente */}

          <div className="w-full max-w-xl bg-[#1e2024] border border-[#414755] p-8 md:p-10 shadow-2xl relative z-20 transition-colors duration-300 hover:border-[#414755]/60">
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
              {/* Names (Grid) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div className="space-y-2">
                  <label
                    className={`text-[12px] font-bold tracking-widest transition-colors duration-200 block ${
                      activeFocus.firstName
                        ? "text-[#00d2fd]"
                        : "text-[#c1c6d7]"
                    }`}
                  >
                    FIRST NAME
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[20px] select-none pointer-events-none">
                      person
                    </span>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onFocus={() => handleFocus("firstName")}
                      onBlur={() => handleBlur("firstName")}
                      placeholder="Enter your first name"
                      className="w-full bg-[#0c0e12] border border-[#414755] py-3 pl-10 pr-4 text-sm text-[#e2e2e8] placeholder-[#8b90a0]/50 transition-all focus:outline-none focus:border-[#00d2fd] focus:ring-1 focus:ring-[#00d2fd] rounded-none"
                      required
                    />
                  </div>
                </div>

                {/* Surname */}
                <div className="space-y-2">
                  <label
                    className={`text-[12px] font-bold tracking-widest transition-colors duration-200 block ${
                      activeFocus.surname ? "text-[#00d2fd]" : "text-[#c1c6d7]"
                    }`}
                  >
                    SURNAME
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[20px] select-none pointer-events-none">
                      badge
                    </span>
                    <input
                      type="text"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      onFocus={() => handleFocus("surname")}
                      onBlur={() => handleBlur("surname")}
                      placeholder="Enter your surname"
                      className="w-full bg-[#0c0e12] border border-[#414755] py-3 pl-10 pr-4 text-sm text-[#e2e2e8] placeholder-[#8b90a0]/50 transition-all focus:outline-none focus:border-[#00d2fd] focus:ring-1 focus:ring-[#00d2fd] rounded-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label
                  className={`text-[12px] font-bold tracking-widest transition-colors duration-200 block ${
                    activeFocus.email ? "text-[#00d2fd]" : "text-[#c1c6d7]"
                  }`}
                >
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[20px] select-none pointer-events-none">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => handleFocus("email")}
                    onBlur={() => handleBlur("email")}
                    placeholder="name@domain.com"
                    className="w-full bg-[#0c0e12] border border-[#414755] py-3 pl-10 pr-4 text-sm text-[#e2e2e8] placeholder-[#8b90a0]/50 transition-all focus:outline-none focus:border-[#00d2fd] focus:ring-1 focus:ring-[#00d2fd] rounded-none"
                    required
                  />
                </div>
              </div>

              {/* Passwords (Grid) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password */}
                <div className="space-y-2">
                  <label
                    className={`text-[12px] font-bold tracking-widest transition-colors duration-200 block ${
                      activeFocus.password ? "text-[#00d2fd]" : "text-[#c1c6d7]"
                    }`}
                  >
                    PASSWORD
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[20px] select-none pointer-events-none">
                      lock
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => handleFocus("password")}
                      onBlur={() => handleBlur("password")}
                      placeholder="••••••••"
                      className="w-full bg-[#0c0e12] border border-[#414755] py-3 pl-10 pr-10 text-sm text-[#e2e2e8] placeholder-[#8b90a0]/50 transition-all focus:outline-none focus:border-[#00d2fd] focus:ring-1 focus:ring-[#00d2fd] rounded-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b90a0] hover:text-[#00d2fd] transition-colors duration-200 cursor-pointer flex items-center justify-center select-none"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label
                    className={`text-[12px] font-bold tracking-widest transition-colors duration-200 block ${
                      activeFocus.confirmPassword
                        ? "text-[#00d2fd]"
                        : "text-[#c1c6d7]"
                    }`}
                  >
                    CONFIRM
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[20px] select-none pointer-events-none">
                      verified_user
                    </span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => handleFocus("confirmPassword")}
                      onBlur={() => handleBlur("confirmPassword")}
                      placeholder="••••••••"
                      className="w-full bg-[#0c0e12] border border-[#414755] py-3 pl-10 pr-10 text-sm text-[#e2e2e8] placeholder-[#8b90a0]/50 transition-all focus:outline-none focus:border-[#00d2fd] focus:ring-1 focus:ring-[#00d2fd] rounded-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b90a0] hover:text-[#00d2fd] transition-colors duration-200 cursor-pointer flex items-center justify-center select-none"
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showConfirmPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Favorite Club Dropdown */}
              <div className="space-y-2">
                <label
                  className={`text-[12px] font-bold tracking-widest transition-colors duration-200 block ${
                    activeFocus.favoriteClub
                      ? "text-[#00d2fd]"
                      : "text-[#c1c6d7]"
                  }`}
                >
                  FAVORITE CLUB
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[20px] select-none pointer-events-none">
                    sports_soccer
                  </span>
                  <select
                    value={favoriteClub}
                    onChange={(e) => setFavoriteClub(e.target.value)}
                    onFocus={() => handleFocus("favoriteClub")}
                    onBlur={() => handleBlur("favoriteClub")}
                    className="w-full bg-[#0c0e12] border border-[#414755] py-3 pl-10 pr-10 text-sm text-[#e2e2e8] appearance-none cursor-pointer focus:outline-none focus:border-[#00d2fd] focus:ring-1 focus:ring-[#00d2fd] rounded-none"
                    required
                  >
                    <option value="" disabled className="bg-[#1e2024]">
                      Select your team
                    </option>
                    <option value="flamengo" className="bg-[#1e2024]">
                      Flamengo (Fan Edition)
                    </option>
                    <option value="real_madrid" className="bg-[#1e2024]">
                      Real Madrid CF
                    </option>
                    <option value="man_city" className="bg-[#1e2024]">
                      Manchester City
                    </option>
                    <option value="bayern" className="bg-[#1e2024]">
                      Bayern Munich
                    </option>
                    <option value="liverpool" className="bg-[#1e2024]">
                      Liverpool FC
                    </option>
                    <option value="other" className="bg-[#1e2024]">
                      Other Global Club
                    </option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#8b90a0] pointer-events-none">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Terms & Conditions */}
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-5 h-5 rounded-none bg-[#0c0e12] border-[#414755] text-[#4b8eff] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  required
                />
                <span className="text-sm text-[#c1c6d7] group-hover:text-[#e2e2e8] transition-colors select-none">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={onOpenTerms}
                    className="text-[#00d2fd] underline hover:text-[#4b8eff] transition-colors bg-transparent border-none p-0 cursor-pointer inline font-bold"
                  >
                    Terms of Protocol
                  </button>{" "}
                  and Privacy Policy.
                </span>
              </label>

              {/* Create Account Button */}
              <button
                type="submit"
                className="w-full bg-[#4b8eff] text-[#00285c] font-bold py-4 mt-4 tracking-widest text-lg hover:bg-[#00d2fd] transition-all active:scale-[0.98] rounded-none cursor-pointer"
              >
                CREATE ACCOUNT
              </button>
            </form>

            {/* Login Link */}
            <div className="text-center mt-6">
              <p className="text-sm text-[#c1c6d7]">
                ALREADY A MEMBER?{" "}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-[#00d2fd] font-bold hover:underline uppercase cursor-pointer"
                >
                  SIGN IN HERE
                </button>
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* BACKGROUND DECORATIVE ELEMENTS */}

      {/* Huge Stadium Icon in Top Right */}
      <div className="fixed top-0 right-0 p-8 opacity-10 pointer-events-none z-0">
        <span
          className="material-symbols-outlined text-[300px]"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          stadium
        </span>
      </div>
    </div>
  );
};
