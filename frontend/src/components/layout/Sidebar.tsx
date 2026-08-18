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
  Star,
  type LucideIcon,
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
  { to: "/lineup", icon: Shield, label: "nav.lineup" },
  { to: "/news", icon: Newspaper, label: "nav.news" },
  { to: "/simulator", icon: Swords, label: "nav.simulator" },
];

const specialNav = [
  { to: "/my-team", icon: Star, label: "nav.myteam", isSpecial: true },
];

const bottomNav = [
  { to: "/notifications", icon: Bell, label: "nav.notifications" },
  { to: "/profile", icon: Settings, label: "nav.profile" },
];

interface NavLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  exact?: boolean;
  isSpecial?: boolean;
}

function NavLink({ to, icon: Icon, label, exact, isSpecial }: NavLinkProps) {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const active = exact ? pathname === to : pathname.startsWith(to);

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
        active
          ? isSpecial
            ? "bg-amber-500 text-white shadow-sm shadow-amber-500/20"
            : "bg-brand text-white shadow-sm"
          : isSpecial
            ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 font-semibold"
            : "text-muted hover:text-foreground hover:bg-surface-2",
      )}
    >
      <Icon
        className={cn(
          "w-[18px] h-[18px] flex-shrink-0",
          isSpecial && !active && "text-amber-400",
        )}
      />
      <span>{t(label, label)}</span>
    </Link>
  );
}

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 w-44 hidden lg:flex flex-col bg-surface border-r border-edge/12 z-40">
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-edge/12 flex-shrink-0">
        <img
          src={AliScoreLogo}
          alt="AliScore"
          className="h-8 w-auto flex-shrink-0"
        />
        <span className="text-sm font-black text-foreground tracking-tight">
          AliScore
        </span>
      </div>

      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5 flex flex-col justify-between">
        <div className="space-y-0.5">
          {mainNav.map((item) => (
            <NavLink key={item.to} {...item} />
          ))}
        </div>

        {/* Linha divisória e item especial (My Team) */}
        <div className="pt-3 mt-3 border-t border-edge/12 space-y-0.5">
          {specialNav.map((item) => (
            <NavLink key={item.to} {...item} />
          ))}
        </div>
      </nav>

      <div className="border-t border-edge/12 py-3 px-2 space-y-0.5 flex-shrink-0">
        {bottomNav.map((item) => (
          <NavLink key={item.to} {...item} />
        ))}
      </div>
    </aside>
  );
}
