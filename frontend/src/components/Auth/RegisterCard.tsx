import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSwitchToLogin,
}) => {
  const { login } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [favoriteClub, setFavoriteClub] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [activeFocus, setActiveFocus] = useState({
    name: false,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword || !favoriteClub) {
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
    login(email, name);
  };

  return (
    <div className="min-h-screen bg-[#111317] text-[#e2e2e8] flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-['Archivo_Narrow']">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 w-full h-16 flex items-center px-8 z-50 bg-[#111317]/80 backdrop-blur-md border-b border-[#414755]/30">
        <div className="text-2xl font-bold text-[#00d2fd] tracking-tighter uppercase">
          SMART FOOTBALL HUB
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 mt-16 relative z-10">
        {/* Left Side: AI Benefits & Visuals */}
        <section className="lg:col-span-5 hidden lg:flex flex-col justify-center space-y-8 pr-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-[#e2e2e8] leading-none tracking-tight">
              ENGINEERED FOR <br />
              <span className="text-[#00d2fd]">VICTORY.</span>
            </h1>
            <p className="text-lg text-[#c1c6d7] max-w-md font-normal leading-relaxed">
              Join the world's most advanced football intelligence platform.
              Leverage industrial-grade data to master the pitch.
            </p>
          </div>

          <div className="space-y-4">
            {/* Tactical Analysis Card */}
            <div className="border border-[#414755] bg-[#1a1c20] p-6 flex gap-4 items-start transition-colors duration-300 hover:border-[#00d2fd]">
              <div className="bg-[#00d2fd]/10 p-3 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[#00d2fd]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  psychology
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#e2e2e8] mb-1">
                  Tactical Analysis
                </h3>
                <p className="text-sm text-[#c1c6d7] leading-relaxed">
                  Real-time heatmaps and formation shifts powered by proprietary
                  neural networks.
                </p>
              </div>
            </div>

            {/* Transfer Advisor Card */}
            <div className="border border-[#414755] bg-[#1a1c20] p-6 flex gap-4 items-start transition-colors duration-300 hover:border-[#00d2fd]">
              <div className="bg-[#00d2fd]/10 p-3 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-[#00d2fd]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  trending_up
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[#e2e2e8] mb-1">
                  Transfer Advisor
                </h3>
                <p className="text-sm text-[#c1c6d7] leading-relaxed">
                  Predictive market value modeling and scout-grade player
                  comparison tools.
                </p>
              </div>
            </div>
          </div>

          {/* Tactical Heatmap Image Visual */}
          <div className="relative w-full aspect-video overflow-hidden border border-[#414755]/50">
            <img
              className="w-full h-full object-cover opacity-60"
              alt="Complex football tactical heatmap dashboard"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjIzjb1_bxTxt4QEnhaQV9MRcsTSsKzQZulDd50U3OmSCwoBJk5GyyQbXsZ_C-4TyU7tNHvrO3lD6s0K6OwHL7mWAHr1NqnhN4Gl1gF-Rvh4VywzRzVZZnauhLCoyId02o9PTyp5RgjCnx9tQhVULIZEDrdvsYuu548u976bP7WzFbiSYs-s8A9yfbjpQgOg5QSUsZmwEqhkAumole-Bvh60wgK3v4ogSjfpT1T9wM-E6mPiUgk6nh"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111317] to-transparent"></div>
          </div>
        </section>

        {/* Right Side: Registration Form */}
        <section className="lg:col-span-7 flex items-center justify-center">
          <div className="w-full max-w-md bg-[#1e2024] border border-[#414755] p-8 md:p-10 shadow-2xl relative z-20 transition-colors duration-300 hover:border-[#00d2fd]">
            <div className="mb-8">
              <div className="text-[12px] font-bold tracking-widest text-[#00d2fd] mb-2 uppercase">
                SYSTEM ACCESS
              </div>
              <h2 className="text-2xl font-semibold text-[#e2e2e8] uppercase">
                CREATE ACCOUNT
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <label
                  className={`text-[12px] font-bold tracking-widest transition-colors duration-200 block ${
                    activeFocus.name ? "text-[#00d2fd]" : "text-[#c1c6d7]"
                  }`}
                >
                  FULL NAME
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#8b90a0] text-[20px] select-none pointer-events-none">
                    person
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onFocus={() => handleFocus("name")}
                    onBlur={() => handleBlur("name")}
                    placeholder="Enter your name"
                    className="w-full bg-[#0c0e12] border border-[#414755] py-3 pl-10 pr-4 text-sm text-[#e2e2e8] placeholder-[#8b90a0]/50 transition-all focus:outline-none focus:border-[#00d2fd] focus:ring-1 focus:ring-[#00d2fd] rounded-none"
                    required
                  />
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
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => handleFocus("password")}
                      onBlur={() => handleBlur("password")}
                      placeholder="••••••••"
                      className="w-full bg-[#0c0e12] border border-[#414755] py-3 pl-10 pr-4 text-sm text-[#e2e2e8] placeholder-[#8b90a0]/50 transition-all focus:outline-none focus:border-[#00d2fd] focus:ring-1 focus:ring-[#00d2fd] rounded-none"
                      required
                    />
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
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => handleFocus("confirmPassword")}
                      onBlur={() => handleBlur("confirmPassword")}
                      placeholder="••••••••"
                      className="w-full bg-[#0c0e12] border border-[#414755] py-3 pl-10 pr-4 text-sm text-[#e2e2e8] placeholder-[#8b90a0]/50 transition-all focus:outline-none focus:border-[#00d2fd] focus:ring-1 focus:ring-[#00d2fd] rounded-none"
                      required
                    />
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
                  className="w-5 h-5 rounded-none bg-[#0c0e12] border-[#414755] text-[#4b8eff] focus:ring-0 focus:ring-offset-0"
                  required
                />
                <span className="text-sm text-[#c1c6d7] group-hover:text-[#e2e2e8] transition-colors">
                  I agree to the{" "}
                  <a className="text-[#00d2fd] underline" href="#">
                    Terms of Protocol
                  </a>{" "}
                  and Privacy Policy.
                </span>
              </label>

              {/* Create Account Button */}
              <button
                type="submit"
                className="w-full bg-[#4b8eff] text-[#00285c] font-bold py-4 mt-4 tracking-widest text-lg hover:bg-[#00d2fd] transition-all active:scale-[0.98] rounded-none"
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
                  className="text-[#00d2fd] font-bold hover:underline uppercase"
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
