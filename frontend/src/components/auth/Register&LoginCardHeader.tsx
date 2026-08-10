import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Search, Sun, Moon, Globe } from "lucide-react";
import { useAppStore } from "@/store/app";
import NotificationBell from "../NotificationBell";
import AliScoreLogo from "../../assets/aliscore.svg";

export function RegisterCardHeader() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, setTheme, lang, setLang } = useAppStore();

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  const toggleLang = () => {
    const next = lang === "en" ? "pt" : "en";
    setLang(next);
    i18n.changeLanguage(next);
    localStorage.setItem("sfh-lang", next);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/teams?search=${encodeURIComponent(q)}`);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 h-20 bg-surface/90 backdrop-blur-md border-b border-edge/12 flex items-center gap-3 px-4 md:px-8 flex-shrink-0">
      {/* Logo / Brand */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <img
          src={isDark ? "/aliscore.svg" : "/aliscorelight.png"}
          alt="AliScore"
          className={`object-contain ${
            isDark ? "w-8 h-8" : "w-10 h-10" // Ajuste os valores conforme necessário para equilibrar visualmente
          }`}
        />
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Language */}
        <button
          type="button"
          onClick={toggleLang}
          title={t("settings.language")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-2 text-muted hover:text-foreground text-xs font-bold transition-colors cursor-pointer"
        >
          <Globe className="w-3.5 h-3.5" />
          {lang.toUpperCase()}
        </button>

        {/* Theme */}
        <button
          type="button"
          onClick={toggleTheme}
          title={t("settings.theme")}
          className="p-2 rounded-lg bg-surface-2 text-muted hover:text-foreground transition-colors cursor-pointer flex items-center justify-center"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <NotificationBell />
      </div>
    </header>
  );
}
