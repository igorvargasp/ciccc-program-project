import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Newspaper,
  Trophy,
  Users,
  User,
  Play,
  Bell,
  Settings,
  Swords,
  Shield,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "../../lib/utils";
import AliScoreLogo from "../../assets/aliscore.svg";

const mainNav = [
  { to: "/home", icon: Home, label: "nav.home", exact: true },
  { to: "/matches", icon: Play, label: "nav.matches" },
  { to: "/competitions", icon: Trophy, label: "nav.competitions" },
  { to: "/teams", icon: Users, label: "nav.teams" },
  { to: "/players", icon: User, label: "nav.players" },
  { to: "/lineup", icon: Shield, label: "Lineup" },
  { to: "/news", icon: Newspaper, label: "nav.news" },
  { to: "/simulator", icon: Swords, label: "nav.simulator" },
];

const bottomNav = [
  { to: "/notifications", icon: Bell, label: "nav.notifications" },
  { to: "/profile", icon: Settings, label: "nav.profile" },
];

function NavLink({
  to,
  icon: Icon,
  label,
  exact,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  exact?: boolean;
}) {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const active = exact ? pathname === to : pathname.startsWith(to);

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
        active
          ? "bg-brand text-white shadow-sm"
          : "text-muted hover:text-foreground hover:bg-surface-2",
      )}
    >
      <Icon className="w-[18px] h-[18px] flex-shrink-0" />
      <span>{t(label)}</span>
    </Link>
  );
}

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-44 hidden lg:flex flex-col bg-surface border-r border-edge/12 z-40">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-edge/12 flex-shrink-0">
        <img src={AliScoreLogo} alt="AliScore" className="h-8 w-auto flex-shrink-0" />
        <span className="text-sm font-black text-foreground tracking-tight">AliScore</span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
        {mainNav.map((item) => (
          <NavLink key={item.to} {...item} />
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="border-t border-edge/12 py-3 px-2 space-y-0.5 flex-shrink-0">
        {bottomNav.map((item) => (
          <NavLink key={item.to} {...item} />
        ))}
      </div>
    </aside>
  );
}
