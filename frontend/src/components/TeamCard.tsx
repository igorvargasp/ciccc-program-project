import { Link } from 'react-router-dom';
import type { Team } from '../types';
import { cn } from '../lib/utils';

interface TeamCardProps {
  team: Team;
  className?: string;
}

export default function TeamCard({ team, className }: TeamCardProps) {
  return (
    <Link to={`/teams/${team.id}`}>
      <div
        className={cn(
          'group bg-surface border border-edge/12 rounded-xl p-4 hover:border-brand/30 transition-all duration-150 flex items-center gap-4',
          className,
        )}
      >
        {/* Crest */}
        <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {team.crestUrl ? (
            <img
              src={team.crestUrl}
              alt={team.name}
              className="w-full h-full object-contain p-1"
            />
          ) : (
            <span className="text-sm font-black text-muted">{team.shortName?.slice(0, 3) ?? team.name.slice(0, 3).toUpperCase()}</span>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0">
          <p className="font-bold text-foreground group-hover:text-brand transition-colors truncate">
            {team.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {team.country && (
              <span className="text-xs text-muted truncate">{team.country}</span>
            )}
            {team.stadium && (
              <>
                <span className="text-xs text-muted/40">·</span>
                <span className="text-xs text-muted truncate">{team.stadium}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
