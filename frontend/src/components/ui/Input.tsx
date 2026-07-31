import { cn } from '../../lib/utils';
import type { InputHTMLAttributes } from 'react';
import type { ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  leftIcon?: ReactNode;
  error?: string;
}

export default function Input({ label, leftIcon, error, className, id, ...rest }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">{leftIcon}</span>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full bg-surface-2 border border-edge/12 rounded-lg py-2 px-3 text-sm text-foreground placeholder:text-muted',
            'focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            leftIcon && 'pl-9',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/30',
            className,
          )}
          {...rest}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
