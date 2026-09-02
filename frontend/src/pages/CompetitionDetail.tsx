import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { getCompetitionStandings, getCompetitionSeasons } from '../api/competitions';
import { listCompetitions } from '../api/competitions';
import StandingsTable from '../components/StandingsTable';
import { PageSpinner } from '../components/ui/Spinner';
import { useStandingsRealtime } from '../hooks/useRealtime';
import { cn } from '../lib/utils';

export default function CompetitionDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [simulated, setSimulated] = useState(false);

  const { data: competitions } = useQuery({
    queryKey: ['competitions'],
    queryFn: listCompetitions,
    staleTime: 5 * 60_000,
  });
  const competition = competitions?.find((c) => c.id === id);

  const { data: seasons } = useQuery({
    queryKey: ['seasons', id],
    queryFn: () => getCompetitionSeasons(id!),
    enabled: !!id,
  });

  const currentSeason = seasons?.find((s) => s.isCurrent) ?? seasons?.[0];

  // Real-time standings updates
  useStandingsRealtime(currentSeason?.id);

  const { data: standingsData, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['standings', id, simulated, currentSeason?.id],
    queryFn: () => getCompetitionStandings(id!, { simulated }),
    enabled: !!id,
    staleTime: 60_000,
  });

  if (!id) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <Link to="/competitions" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> {t('common.back')}
      </Link>

      {/* Header */}
      <div className="bg-surface border border-edge/12 rounded-2xl p-6 flex items-center gap-5">
        {competition?.logoUrl && (
          <img src={competition.logoUrl} alt={competition.name} className="w-16 h-16 object-contain" />
        )}
        <div>
          <h1 className="text-2xl font-black text-foreground">
            {competition?.name ?? '…'}
          </h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted">
            {competition?.country && <span>{competition.country}</span>}
            {currentSeason && (
              <span className="bg-surface-2 px-2 py-0.5 rounded text-xs font-semibold">
                {currentSeason.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Real / Simulated toggle */}
        <div className="flex gap-1 bg-surface-2 rounded-xl p-1">
          <button
            onClick={() => setSimulated(false)}
            className={cn('px-3 py-1.5 text-sm font-semibold rounded-lg transition-all', !simulated ? 'bg-brand text-white' : 'text-muted hover:text-foreground')}
          >
            {t('competitions.realStandings')}
          </button>
          <button
            onClick={() => setSimulated(true)}
            className={cn('px-3 py-1.5 text-sm font-semibold rounded-lg transition-all', simulated ? 'bg-brand text-white' : 'text-muted hover:text-foreground')}
          >
            {t('competitions.simulatedStandings')}
          </button>
        </div>

        {/* Refresh */}
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 rounded-lg bg-surface-2 text-muted hover:text-foreground transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={cn('w-4 h-4', isFetching && 'animate-spin')} />
        </button>
      </div>

      {/* Standings table */}
      <div className="bg-surface border border-edge/12 rounded-2xl p-5">
        {isLoading ? (
          <PageSpinner />
        ) : standingsData?.table.length ? (
          <StandingsTable rows={standingsData.table} />
        ) : (
          <p className="text-muted text-sm text-center py-8">{t('common.noData')}</p>
        )}
      </div>
    </div>
  );
}
