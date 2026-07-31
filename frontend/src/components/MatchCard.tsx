import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Match, Team } from '../types';
import { cn, formatKickoff, formatMatchDay } from '../lib/utils';
import Badge from './ui/Badge';

interface MatchCardProps {
  match: Match;
  homeTeam?: Team;
  awayTeam?: Team;
  compact?: boolean;
}

function TeamBlock({ team, score, align }: { team?: Team; score?: number | null; align: 'left' | 'right' }) {
  return (
    <div className={cn('flex items-center gap-2 flex-1', align === 'right' && 'flex-row-reverse')}>
      {/* Crest */}
      <div className="w-8 h-8 rounded-md bg-surface-2 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {team?.crestUrl ? (
          <img src={team.crestUrl} alt={team.name} className="w-full h-full object-contain p-0.5" />
        ) : (
          <span className="text-xs font-bold text-muted">
            {team?.shortName?.slice(0, 3) ?? '?'}
          </span>
        )}
      </div>
      <span className={cn('text-sm font-semibold text-foreground truncate', align === 'right' && 'text-right')}>
        {team?.shortName ?? team?.name ?? '—'}
      </span>
      {score !== undefined && score !== null && (
        <span className="text-xl font-black text-foreground flex-shrink-0">{score}</span>
      )}
    </div>
  );
}

export default function MatchCard({ match, homeTeam, awayTeam, compact }: MatchCardProps) {
  const { t } = useTranslation();

  const statusBadge =
    match.status === 'live' ? (
      <Badge variant="live" dot>{t('matches.live')}</Badge>
    ) : match.status === 'finished' ? (
      <Badge variant="finished">{t('matches.fulltime')}</Badge>
    ) : (
      <Badge variant="scheduled">
        {formatMatchDay(match.kickoffAt)} · {formatKickoff(match.kickoffAt)}
      </Badge>
    );

  return (
    <Link to={`/matches/${match.id}`}>
      <div
        className={cn(
          'group bg-surface border border-edge/12 rounded-xl p-4 hover:border-brand/30 transition-all duration-150 cursor-pointer',
          match.status === 'live' && 'border-green-500/20',
        )}
      >
        {/* Status + matchday */}
        <div className="flex items-center justify-between mb-3">
          {statusBadge}
          {match.matchday && (
            <span className="text-xs text-muted">{t('matches.matchday', { n: match.matchday })}</span>
          )}
        </div>

        {/* Teams + scores */}
        {compact ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-foreground truncate">
              {homeTeam?.shortName ?? '—'}
            </span>
            <span className="text-base font-black text-foreground mx-1">
              {match.status !== 'scheduled'
                ? `${match.homeScore ?? '?'} – ${match.awayScore ?? '?'}`
                : t('common.vs')}
            </span>
            <span className="text-sm font-semibold text-foreground truncate text-right">
              {awayTeam?.shortName ?? '—'}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <TeamBlock team={homeTeam} score={match.status !== 'scheduled' ? match.homeScore : undefined} align="left" />
            {match.status === 'scheduled' ? (
              <span className="text-xs font-bold text-muted px-1 flex-shrink-0">{t('common.vs')}</span>
            ) : (
              <span className="text-xs text-muted flex-shrink-0">–</span>
            )}
            <TeamBlock team={awayTeam} score={match.status !== 'scheduled' ? match.awayScore : undefined} align="right" />
          </div>
        )}

        {/* Venue */}
        {match.venue && !compact && (
          <p className="text-xs text-muted mt-3 truncate">{match.venue}</p>
        )}
      </div>
    </Link>
  );
}
