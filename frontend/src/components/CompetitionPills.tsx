import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { listCompetitions } from '../api/competitions';
import { cn } from '../lib/utils';

interface Props {
  value: string | undefined;
  onChange: (id: string | undefined) => void;
}

export default function CompetitionPills({ value, onChange }: Props) {
  const { t } = useTranslation();
  const { data: competitions } = useQuery({
    queryKey: ['competitions'],
    queryFn: listCompetitions,
    staleTime: 10 * 60_000,
  });

  if (!competitions?.length) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onChange(undefined)}
        className={cn(
          'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
          !value
            ? 'bg-brand text-white border-brand'
            : 'bg-surface-2 text-muted border-edge/12 hover:text-foreground',
        )}
      >
        {t('common.all')}
      </button>
      {competitions.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id === value ? undefined : c.id)}
          className={cn(
            'px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
            value === c.id
              ? 'bg-brand text-white border-brand'
              : 'bg-surface-2 text-muted border-edge/12 hover:text-foreground',
          )}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}
