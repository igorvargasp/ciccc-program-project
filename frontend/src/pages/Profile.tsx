import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Bell, BellOff } from 'lucide-react';
import { getMe, updatePreferences } from '../api/me';
import { listFavorites, removeFavorite } from '../api/favorites';
import { useAppStore } from '../store/app';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import { cn } from '../lib/utils';

type Theme = 'light' | 'dark' | 'system';
const THEMES: Theme[] = ['dark', 'light', 'system'];
const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'es', label: 'Español' },
];

export default function Profile() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme, lang, setLang, token } = useAppStore();
  const { logout } = useAuth();
  const qc = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: !!token,
  });

  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: listFavorites,
    enabled: !!token,
  });

  const savePrefs = useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });

  const removeFav = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const prefs = user?.preferences;

  const handleThemeChange = (t: Theme) => {
    setTheme(t);
    if (token) savePrefs.mutate({ theme: t });
    // Apply class immediately
    const root = document.documentElement;
    const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', isDark);
  };

  const handleLangChange = (code: string) => {
    setLang(code);
    i18n.changeLanguage(code);
    localStorage.setItem('sfh-lang', code);
  };

  const toggleNotification = (key: 'notifyMatches' | 'notifyTeamNews') => {
    if (!token || !prefs) return;
    const patch = { [key]: !prefs[key] };
    savePrefs.mutate(patch);
  };

  return (
    <div className="space-y-8 max-w-xl">
      <h1 className="text-2xl font-black text-foreground">{t('settings.title')}</h1>

      {/* Appearance */}
      <section className="bg-surface border border-edge/12 rounded-2xl p-5 space-y-4">
        <h2 className="text-base font-extrabold text-foreground">{t('settings.appearance')}</h2>

        {/* Theme */}
        <div>
          <p className="text-sm text-muted mb-2">{t('settings.theme')}</p>
          <div className="flex gap-2">
            {THEMES.map((th) => (
              <button
                key={th}
                onClick={() => handleThemeChange(th)}
                className={cn(
                  'flex-1 py-2 rounded-xl text-sm font-semibold border transition-all capitalize',
                  theme === th
                    ? 'bg-brand text-white border-brand'
                    : 'bg-surface-2 text-muted border-edge/12 hover:text-foreground',
                )}
              >
                {t(`settings.${th}Mode`)}
              </button>
            ))}
          </div>
        </div>

        {/* Language */}
        <div>
          <p className="text-sm text-muted mb-2">{t('settings.language')}</p>
          <div className="flex gap-2">
            {LANGS.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => handleLangChange(code)}
                className={cn(
                  'flex-1 py-2 rounded-xl text-sm font-semibold border transition-all',
                  lang === code
                    ? 'bg-brand text-white border-brand'
                    : 'bg-surface-2 text-muted border-edge/12 hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Notifications (auth required) */}
      {token && prefs && (
        <section className="bg-surface border border-edge/12 rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-extrabold text-foreground">{t('settings.notifications')}</h2>

          {([['notifyMatches', 'settings.notifyMatches'], ['notifyTeamNews', 'settings.notifyTeamNews']] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="text-sm text-foreground">{t(label)}</span>
              <button
                onClick={() => toggleNotification(key)}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors',
                  prefs[key] ? 'bg-brand' : 'bg-surface-2',
                )}
              >
                <span
                  className={cn(
                    'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                    prefs[key] && 'translate-x-5',
                  )}
                />
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Favourite teams */}
      {token && (
        <section className="bg-surface border border-edge/12 rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-extrabold text-foreground">{t('settings.favoriteTeams')}</h2>
          {!favorites?.length ? (
            <p className="text-sm text-muted">{t('common.noData')}</p>
          ) : (
            <ul className="space-y-2">
              {favorites.map((fav) => (
                <li key={fav.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {fav.team.crestUrl && (
                      <img src={fav.team.crestUrl} alt={fav.team.name} className="w-6 h-6 object-contain" />
                    )}
                    <span className="text-sm font-semibold text-foreground">{fav.team.name}</span>
                    {fav.isPrimary && (
                      <span className="text-xs text-brand font-semibold">★ Primary</span>
                    )}
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={removeFav.isPending}
                    onClick={() => removeFav.mutate(fav.team.id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Sign in prompt */}
      {!token && (
        <section className="bg-surface border border-edge/12 rounded-2xl p-6 text-center space-y-3">
          <Bell className="w-8 h-8 text-muted mx-auto" />
          <p className="text-sm text-muted">{t('settings.signIn')}</p>
        </section>
      )}

      {/* Sign out */}
      {token && (
        <Button
          variant="outline"
          onClick={() => {
            void logout().then(() => qc.clear());
          }}
          className="w-full"
        >
          <BellOff className="w-4 h-4" />
          {t('settings.signOut')}
        </Button>
      )}
    </div>
  );
}
