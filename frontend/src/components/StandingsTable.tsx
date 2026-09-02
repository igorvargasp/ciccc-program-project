import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { StandingRow } from '../types';
import { cn } from '../lib/utils';

interface StandingsTableProps {
  rows: StandingRow[];
  highlightTeamId?: string;
  compact?: boolean;
}

export default function StandingsTable({ rows, highlightTeamId, compact }: StandingsTableProps) {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-muted font-semibold border-b border-edge/12">
            <th className="text-left pb-2 pr-2 w-8">{t('competitions.pos')}</th>
            <th className="text-left pb-2">{t('competitions.team')}</th>
            {!compact && (
              <>
                <th className="text-center pb-2 px-1">{t('competitions.played')}</th>
                <th className="text-center pb-2 px-1">{t('competitions.won')}</th>
                <th className="text-center pb-2 px-1">{t('competitions.drawn')}</th>
                <th className="text-center pb-2 px-1">{t('competitions.lost')}</th>
                <th className="text-center pb-2 px-1">{t('competitions.goalsFor')}</th>
                <th className="text-center pb-2 px-1">{t('competitions.goalsAgainst')}</th>
                <th className="text-center pb-2 px-1">{t('competitions.gd')}</th>
              </>
            )}
            <th className="text-center pb-2 pl-1 font-black">{t('competitions.points')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isHighlighted = row.team.id === highlightTeamId;
            const gd = row.goalsFor - row.goalsAgainst;
            return (
              <tr
                key={row.team.id}
                className={cn(
                  'border-b border-edge/6 transition-colors',
                  isHighlighted && 'bg-brand/6',
                )}
              >
                {/* Position */}
                <td className="py-2.5 pr-2">
                  <span
                    className={cn(
                      'w-6 h-6 flex items-center justify-center rounded text-xs font-bold',
                      row.position <= 4
                        ? 'text-blue-400'
                        : row.position >= rows.length - 2
                          ? 'text-red-400'
                          : 'text-muted',
                    )}
                  >
                    {row.position}
                  </span>
                </td>

                {/* Team */}
                <td className="py-2.5">
                  <Link
                    to={`/teams/${row.team.id}`}
                    className="flex items-center gap-2 hover:text-brand transition-colors"
                  >
                    {row.team.crestUrl && (
                      <img
                        src={row.team.crestUrl}
                        alt={row.team.name}
                        className="w-5 h-5 object-contain flex-shrink-0"
                      />
                    )}
                    <span className={cn('font-medium truncate', isHighlighted && 'font-bold text-brand')}>
                      {row.team.shortName ?? row.team.name}
                    </span>
                  </Link>
                </td>

                {!compact && (
                  <>
                    <td className="py-2.5 text-center text-muted px-1">{row.played}</td>
                    <td className="py-2.5 text-center text-muted px-1">{row.won}</td>
                    <td className="py-2.5 text-center text-muted px-1">{row.drawn}</td>
                    <td className="py-2.5 text-center text-muted px-1">{row.lost}</td>
                    <td className="py-2.5 text-center text-muted px-1">{row.goalsFor}</td>
                    <td className="py-2.5 text-center text-muted px-1">{row.goalsAgainst}</td>
                    <td className={cn('py-2.5 text-center px-1 text-xs', gd > 0 ? 'text-green-400' : gd < 0 ? 'text-red-400' : 'text-muted')}>
                      {gd > 0 ? `+${gd}` : gd}
                    </td>
                  </>
                )}

                {/* Points */}
                <td className="py-2.5 text-center pl-1">
                  <span className="font-black text-foreground">{row.points}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
