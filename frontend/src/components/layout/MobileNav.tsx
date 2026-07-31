import { Link, useLocation } from 'react-router-dom';
import { Home, Play, Trophy, Users, Newspaper } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';

const items = [
  { to: '/', icon: Home, label: 'nav.home', exact: true },
  { to: '/matches', icon: Play, label: 'nav.matches' },
  { to: '/competitions', icon: Trophy, label: 'nav.competitions' },
  { to: '/teams', icon: Users, label: 'nav.teams' },
  { to: '/news', icon: Newspaper, label: 'nav.news' },
];

export default function MobileNav() {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 inset-x-0 lg:hidden bg-surface/95 backdrop-blur border-t border-edge/12 z-40">
      <div className="flex">
        {items.map(({ to, icon: Icon, label, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-3 text-[11px] font-semibold transition-colors',
                active ? 'text-brand' : 'text-muted',
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{t(label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
