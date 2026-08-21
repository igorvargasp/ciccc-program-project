import { useTranslation } from 'react-i18next';
import { Sun, Moon, Globe } from 'lucide-react';
import { useAppStore } from '../../store/app';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../NotificationBell';
import AliScoreLogo from '../../assets/aliscore.svg';

/**
 * Greet by first name only: the account carries a single `name` field, and
 * full names here are commonly three or four words, which would crowd the
 * header on narrow screens.
 */
function firstNameOf(name?: string | null): string | null {
  const first = name?.trim().split(/\s+/)[0];
  return first || null;
}

export default function Header() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme, lang, setLang } = useAppStore();
  const { user } = useAuth();

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const toggleTheme = () => setTheme(isDark ? 'light' : 'dark');

  const toggleLang = () => {
    const cycle: Record<string, string> = { en: 'pt', pt: 'es', es: 'en' };
    const next = cycle[lang] ?? 'en';
    setLang(next);
    i18n.changeLanguage(next);
    localStorage.setItem('sfh-lang', next);
  };

  const greetingName = firstNameOf(user?.name) ?? user?.email?.split('@')[0];

  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/90 backdrop-blur-md border-b border-edge/12 flex items-center gap-3 px-4 md:px-6 flex-shrink-0">
      {/* Logo (mobile only) */}
      <div className="flex items-center gap-2 lg:hidden flex-shrink-0">
        <img src={AliScoreLogo} alt="AliScore" className="w-7 h-7" />
        <span className="text-sm font-black text-foreground">AliScore</span>
      </div>

      {/* Greeting. This replaced a search box that only ever searched clubs —
          a header field implies it searches everything, and the Teams page
          already has its own. Nothing renders while signed out. */}
      {greetingName && (
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground truncate">
            {t('header.welcome', 'Welcome')},{' '}
            <span className="font-bold">{greetingName}</span>
          </p>
        </div>
      )}

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
