import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Player } from '../types';
import { cn } from '../lib/utils';
import Avatar from './ui/Avatar';

interface PlayerCardProps {
  player: Player;
  compact?: boolean;
}

const positionColors: Record<string, string> = {
  GK: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  DEF: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  MID: 'bg-green-500/10 text-green-400 border-green-500/20',
  FWD: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function PlayerCard({ player, compact }: PlayerCardProps) {
  const { t } = useTranslation();

  return (
    <Link to={`/players/${player.id}`}>
      <div
        className={cn(
          'group bg-surface border border-edge/12 rounded-xl hover:border-brand/30 transition-all duration-150 flex items-center gap-3',
          compact ? 'p-3' : 'p-4',
        )}
      >
        {/* Number/avatar */}
        <div className="flex-shrink-0 w-9 flex items-center justify-center">
          {player.shirtNumber ? (
            <span className="text-lg font-black text-muted group-hover:text-foreground transition-colors">
              #{player.shirtNumber}
            </span>
          ) : (
            <Avatar name={player.fullName} size="md" />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="font-bold text-foreground group-hover:text-brand transition-colors truncate">
            {player.fullName}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {player.position && (
              <span
                className={cn(
                  'text-xs font-semibold px-1.5 py-0.5 rounded border',
                  positionColors[player.position] ?? 'bg-surface-2 text-muted',
                )}
              >
                {t(`positions.${player.position}`)}
              </span>
            )}
            {player.nationality && (
              <span className="text-xs text-muted truncate">{player.nationality}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
