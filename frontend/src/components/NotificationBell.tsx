import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { listNotifications, markAllNotificationsRead } from '../api/notifications';
import { useNotificationRealtime } from '../hooks/useRealtime';
import { useAppStore } from '../store/app';
import { relativeTime, cn } from '../lib/utils';

export default function NotificationBell() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const token = useAppStore((s) => s.token);
  const qc = useQueryClient();

  // Real-time listener
  useNotificationRealtime();

  const { data: notifications } = useQuery({
    queryKey: ['notifications', { unreadOnly: false }],
    queryFn: () => listNotifications({ limit: 20 }),
    enabled: !!token,
    staleTime: 30_000,
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!token) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg bg-surface-2 text-muted hover:text-foreground transition-colors"
        title={t('notifications.title')}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-brand text-white text-[10px] font-black rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-surface border border-edge/12 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-edge/12">
            <h3 className="text-sm font-bold text-foreground">{t('notifications.title')}</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="text-xs text-brand font-semibold hover:underline"
              >
                {t('notifications.markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {!notifications?.length ? (
              <p className="text-sm text-muted text-center py-8">{t('notifications.empty')}</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'px-4 py-3 border-b border-edge/6 last:border-0',
                    !n.isRead && 'bg-brand/4',
                  )}
                >
                  {!n.isRead && (
                    <span className="w-1.5 h-1.5 rounded-full bg-brand inline-block mr-2 flex-shrink-0" />
                  )}
                  <p className="text-sm font-semibold text-foreground">{n.title}</p>
                  {n.body && <p className="text-xs text-muted mt-0.5">{n.body}</p>}
                  <p className="text-xs text-muted mt-1">{relativeTime(n.createdAt)}</p>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-edge/12">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-brand font-semibold hover:underline"
            >
              {t('common.seeAll')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
