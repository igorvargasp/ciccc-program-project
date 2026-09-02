import { cn } from '../../lib/utils';

type Variant = 'live' | 'scheduled' | 'finished' | 'default' | 'brand';

const variantMap: Record<Variant, string> = {
  live: 'bg-green-500/10 text-green-400 border-green-500/20',
  scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  finished: 'bg-edge/10 text-muted border-edge/20',
  default: 'bg-surface-2 text-muted border-edge/20',
  brand: 'bg-brand/10 text-brand border-brand/20',
};

interface BadgeProps {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
  dot?: boolean;
}

export default function Badge({ variant = 'default', className, children, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border',
        variantMap[variant],
        className,
      )}
    >
      {dot && variant === 'live' && (
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-live-dot" />
      )}
      {children}
    </span>
  );
}
