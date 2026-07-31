import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Sun, Moon, Globe } from 'lucide-react';
import { useAppStore } from '../../store/app';
import NotificationBell from '../NotificationBell';
import AliScoreLogo from '../../assets/aliscore.svg';

export default function Header() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { theme, setTheme, lang, setLang } = useAppStore();

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  const toggleLang = () => {
    const next = lang === 'en' ? 'pt' : 'en';
    setLang(next);
    i18n.changeLanguage(next);
    localStorage.setItem('sfh-lang', next);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/teams?search=${encodeURIComponent(q)}`);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/90 backdrop-blur-md border-b border-edge/12 flex items-center gap-3 px-4 md:px-6 flex-shrink-0">
      {/* Logo (mobile only) */}
      <div className="flex items-center gap-2 lg:hidden flex-shrink-0">
        <img src={AliScoreLogo} alt="AliScore" className="w-7 h-7" />
        <span className="text-sm font-black text-foreground">AliScore</span>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full pl-9 pr-3 py-2 bg-surface-2 rounded-lg text-sm text-foreground placeholder:text-muted border border-edge/12 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/20 transition-colors"
          />
        </div>
      </form>

      {/* Right controls */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Language */}
        <button
          onClick={toggleLang}
          title={t('settings.language')}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-2 text-muted hover:text-foreground text-xs font-bold transition-colors"
        >
          <Globe className="w-3.5 h-3.5" />
          {lang.toUpperCase()}
        </button>

        {/* Theme */}
        <button
          onClick={toggleTheme}
          title={t('settings.theme')}
          className="p-2 rounded-lg bg-surface-2 text-muted hover:text-foreground transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <NotificationBell />
      </div>
    </header>
  );
}
