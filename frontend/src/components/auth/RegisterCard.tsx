import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { authClient } from "@/auth";
import { RegisterCardHeader } from "./Register&LoginCardHeader";
import { useTranslation } from "react-i18next";
import { SelectFavoriteTeamModal } from "../modals/SelectFavoriteTeamModal";
import toast, { Toaster } from "react-hot-toast";

interface RegisterPageProps {
  onSwitchToLogin?: () => void;
  onOpenTerms?: () => void;
  onSuccessRegister?: () => void;
}

interface AppFeature {
  name: string;
  description: string;
  icon: string;
  tag: string;
}

const getAppFeatures = (t: (key: string) => string): AppFeature[] => [
  {
    name: t("features.tacticalAnalysis.name"),
    description: t("features.tacticalAnalysis.description"),
    icon: "psychology",
    tag: t("features.tacticalAnalysis.tag"),
  },
  {
    name: t("features.transferAdvisor.name"),
    description: t("features.transferAdvisor.description"),
    icon: "trending_up",
    tag: t("features.transferAdvisor.tag"),
  },
  {
    name: t("features.scoutingRadar.name"),
    description: t("features.scoutingRadar.description"),
    icon: "radar",
    tag: t("features.scoutingRadar.tag"),
  },
  {
    name: t("features.personalizedHub.name"),
    description: t("features.personalizedHub.description"),
    icon: "dashboard",
    tag: t("features.personalizedHub.tag"),
  },
  {
    name: t("features.matchCalendar.name"),
    description: t("features.matchCalendar.description"),
    icon: "calendar_month",
    tag: t("features.matchCalendar.tag"),
  },
  {
    name: t("features.matchHistory.name"),
    description: t("features.matchHistory.description"),
    icon: "history",
    tag: t("features.matchHistory.tag"),
  },
  {
    name: t("features.leagueTables.name"),
    description: t("features.leagueTables.description"),
    icon: "format_list_numbered",
    tag: t("features.leagueTables.tag"),
  },
  {
    name: t("features.matchSimulator.name"),
    description: t("features.matchSimulator.description"),
    icon: "sports_esports",
    tag: t("features.matchSimulator.tag"),
  },
  {
    name: t("features.dreamLineup.name"),
    description: t("features.dreamLineup.description"),
    icon: "assignment",
    tag: t("features.dreamLineup.tag"),
  },
  {
    name: t("features.dualTheme.name"),
    description: t("features.dualTheme.description"),
    icon: "contrast",
    tag: t("features.dualTheme.tag"),
  },
  {
    name: t("features.liveAlerts.name"),
    description: t("features.liveAlerts.description"),
    icon: "notifications_active",
    tag: t("features.liveAlerts.tag"),
  },
  {
    name: t("features.aiFormations.name"),
    description: t("features.aiFormations.description"),
    icon: "grid_view",
    tag: t("features.aiFormations.tag"),
  },
];

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSwitchToLogin,
  onOpenTerms,
  onSuccessRegister,
}) => {
  const { login } = useAuth();
  const { t } = useTranslation();

  const appFeatures = getAppFeatures(t);

  // Form States
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Interface States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

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
        label: t("auth.passwordEmpty", "Empty"),
        color: "bg-transparent",
        text: "text-muted",
      };

    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1:
        return {
          score,
          label: t("auth.passwordWeak", "Weak"),
          color: "bg-red-500",
          text: "text-red-500",
        };
      case 2:
        return {
          score,
          label: t("auth.passwordFair", "Fair"),
          color: "bg-orange-500",
          text: "text-orange-500",
        };
      case 3:
        return {
          score,
          label: t("auth.passwordGood", "Good"),
          color: "bg-yellow-500",
          text: "text-yellow-500",
        };
      case 4:
        return {
          score,
          label: t("auth.passwordStrong", "Strong"),
          color: "bg-brand",
          text: "text-brand",
        };
      default:
        return {
          score,
          label: t("auth.passwordVeryWeak", "Very Weak"),
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
      toast.error(t("auth.errorFillFields", "Please fill in all fields."));
      return;
    }
    if (passwordStrength.score < 3) {
      toast.error(
        t(
          "auth.errorStrongerPassword",
          "Please create a stronger password (must include uppercase, number, or special character).",
        ),
      );
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t("auth.errorPasswordMatch", "Passwords do not match."));
      return;
    }
    if (!agreeTerms) {
      toast.error(
        t("auth.errorAgreeTerms", "You must agree to the Terms of Protocol."),
      );
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

      login(email, fullName);
      toast.success(t("auth.successRegister", "Account created successfully!"));

      // Abre o modal de escolha do time antes de finalizar a navegação para a home
      setIsTeamModalOpen(true);
    } catch (error: unknown) {
      console.error("Registration error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "An error occurred during registration.";

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmTeam = (_team: Team) => {
    setIsTeamModalOpen(false);
    if (onSuccessRegister) {
      onSuccessRegister();
    }
  };

  return (
    <div className="min-h-screen text-foreground flex items-center justify-center p-4 md:p-8 relative overflow-hidden bg-background">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "var(--surface, #1e293b)",
            color: "var(--foreground, #f8fafc)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          },
        }}
      />
      <RegisterCardHeader />

      <main className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 mt-24 relative z-10">
        {/* Left Carousel */}
        <section className="lg:col-span-5 hidden lg:flex flex-col justify-center space-y-4 pr-4">
          <div className="space-y-3">
            <h1 className="text-5xl font-black text-foreground leading-none tracking-tight">
              {t("register.heroTitle1", "PREDICT THE")} <br />
              <span className="text-brand">
                {t("register.heroTitle2", "UNPREDICTED.")}
              </span>
            </h1>
            <p className="text-base text-muted max-w-md font-normal leading-relaxed">
              {t(
                "register.heroSubtitle",
                "Join the world's most advanced football intelligence platform.",
              )}
            </p>
          </div>

          <div className="relative flex items-center justify-center w-full h-[320px] gap-2">
            <button
              type="button"
              onClick={prevFeature}
              className="z-30 p-2 rounded-full border border-edge/12 bg-surface/80 hover:bg-surface text-foreground hover:text-brand transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
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
                    className={`absolute w-[220px] h-[260px] p-6 flex flex-col items-center justify-between border transition-all duration-500 ease-out rounded-xl ${
                      isActive
                        ? "bg-surface border-brand shadow-[0_0_30px_rgba(0,210,253,0.25)]"
                        : "bg-surface/60 border-edge/20"
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
                      className={`p-4 flex items-center justify-center rounded-lg transition-colors duration-300 ${
                        isActive
                          ? "bg-brand/15 text-brand"
                          : "bg-surface-2 text-muted"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[36px]">
                        {feature.icon}
                      </span>
                    </div>

                    <div className="text-center flex-1 flex flex-col justify-center mt-3">
                      <h3
                        className={`text-lg font-extrabold tracking-tight mb-1 uppercase ${
                          isActive ? "text-foreground" : "text-muted"
                        }`}
                      >
                        {feature.name}
                      </h3>
                      <p
                        className={`text-[11px] leading-relaxed ${
                          isActive
                            ? "text-muted opacity-100"
                            : "text-muted/60 opacity-0"
                        }`}
                      >
                        {feature.description}
                      </p>
                    </div>

                    {isActive && (
                      <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 bg-brand/10 text-brand border border-brand/30 rounded-full">
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
              className="z-30 p-2 rounded-full border border-edge/12 bg-surface/80 hover:bg-surface text-foreground hover:text-brand transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[24px]">
                chevron_right
              </span>
            </button>
          </div>
        </section>

        {/* Register Form */}
        <section className="lg:col-span-7 flex items-center justify-center">
          <div className="w-full max-w-xl bg-surface border border-edge/12 p-8 md:p-10 shadow-2xl relative z-20 rounded-2xl">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-brand via-blue-500 to-transparent rounded-t-2xl"></div>
            <div className="mb-8">
              <div className="text-[12px] font-extrabold tracking-widest text-brand mb-2 uppercase">
                {t("register.systemAccess", "SYSTEM ACCESS")}
              </div>
              <h2 className="text-2xl font-black text-foreground uppercase">
                {t("register.createAccountTitle", "CREATE ACCOUNT")}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    className={`text-[12px] font-extrabold tracking-widest transition-colors ${
                      activeFocus.firstName ? "text-brand" : "text-muted"
                    }`}
                  >
                    {t("register.firstName", "FIRST NAME")}
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-muted text-[20px] pointer-events-none">
                      person
                    </span>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      onFocus={() => handleFocus("firstName")}
                      onBlur={() => handleBlur("firstName")}
                      placeholder={t(
                        "register.firstNamePlaceholder",
                        "Enter your first name",
                      )}
                      className="w-full bg-surface-2 border border-edge/12 rounded-lg py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-brand"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className={`text-[12px] font-extrabold tracking-widest transition-colors ${
                      activeFocus.surname ? "text-brand" : "text-muted"
                    }`}
                  >
                    {t("register.surname", "SURNAME")}
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-muted text-[20px] pointer-events-none">
                      badge
                    </span>
                    <input
                      type="text"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      onFocus={() => handleFocus("surname")}
                      onBlur={() => handleBlur("surname")}
                      placeholder={t(
                        "register.surnamePlaceholder",
                        "Enter your surname",
                      )}
                      className="w-full bg-surface-2 border border-edge/12 rounded-lg py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-brand"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className={`text-[12px] font-extrabold tracking-widest transition-colors ${
                    activeFocus.email ? "text-brand" : "text-muted"
                  }`}
                >
                  {t("register.emailAddress", "EMAIL ADDRESS")}
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-muted text-[20px] pointer-events-none">
                    mail
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => handleFocus("email")}
                    onBlur={() => handleBlur("email")}
                    placeholder="name@domain.com"
                    className="w-full bg-surface-2 border border-edge/12 rounded-lg py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:border-brand"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    className={`text-[12px] font-extrabold tracking-widest transition-colors ${
                      activeFocus.password ? "text-brand" : "text-muted"
                    }`}
                  >
                    {t("register.password", "PASSWORD")}
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-muted text-[20px] pointer-events-none">
                      lock
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => handleFocus("password")}
                      onBlur={() => handleBlur("password")}
                      placeholder="••••••••"
                      className="w-full bg-surface-2 border border-edge/12 rounded-lg py-3 pl-10 pr-10 text-sm text-foreground focus:outline-none focus:border-brand"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-muted hover:text-brand flex items-center justify-center cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>

                  {password && (
                    <div className="pt-1 space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-extrabold tracking-wider uppercase">
                        <span className="text-muted">
                          {t("register.securityLevel", "Security Level:")}
                        </span>
                        <span className={passwordStrength.text}>
                          {passwordStrength.label}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-surface-2 border border-edge/12 rounded-full flex gap-0.5 p-[1px] overflow-hidden">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-full flex-1 transition-all duration-500 rounded-full ${
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
                    className={`text-[12px] font-extrabold tracking-widest transition-colors ${
                      activeFocus.confirmPassword ? "text-brand" : "text-muted"
                    }`}
                  >
                    {t("register.confirmPassword", "CONFIRM")}
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-muted text-[20px] pointer-events-none">
                      verified_user
                    </span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={() => handleFocus("confirmPassword")}
                      onBlur={() => handleBlur("confirmPassword")}
                      placeholder="••••••••"
                      className="w-full bg-surface-2 border border-edge/12 rounded-lg py-3 pl-10 pr-10 text-sm text-foreground focus:outline-none focus:border-brand"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 text-muted hover:text-brand flex items-center justify-center cursor-pointer"
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
                  className="w-5 h-5 bg-surface-2 border-edge/12 rounded text-brand focus:ring-brand/20"
                  required
                />
                <span className="text-sm text-muted group-hover:text-foreground">
                  {t("register.agreeText", "I agree to the")}{" "}
                  <button
                    type="button"
                    onClick={onOpenTerms}
                    className="text-brand underline hover:text-brand/80 font-bold cursor-pointer"
                  >
                    {t("register.termsOfProtocol", "Terms of Protocol")}
                  </button>{" "}
                  {t("register.andPrivacyPolicy", "and Privacy Policy.")}
                </span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-brand text-slate-950 font-extrabold py-4 mt-4 tracking-widest text-lg hover:bg-brand/90 transition-all disabled:opacity-50 cursor-pointer uppercase rounded-xl shadow-lg shadow-brand/20"
              >
                {isSubmitting
                  ? t("register.creatingAccount", "CREATING ACCOUNT...")
                  : t("register.createAccountButton", "CREATE ACCOUNT")}
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-muted">
                {t("register.alreadyMember", "ALREADY A MEMBER?")}{" "}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-brand hover:underline font-bold ml-1 cursor-pointer"
                >
                  {t("register.logIn", "LOG IN")}
                </button>
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Modal de Seleção de Time Favorito pós-registro */}
      <SelectFavoriteTeamModal
        isOpen={isTeamModalOpen}
        isFirstTime={true}
        onConfirm={handleConfirmTeam}
      />
    </div>
  );
};
