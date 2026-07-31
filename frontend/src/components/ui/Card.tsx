import { cn } from '../../lib/utils';
import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated';
}

export default function Card({ variant = 'default', className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-edge/12 transition-colors',
        variant === 'default' ? 'bg-surface' : 'bg-surface-2',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
