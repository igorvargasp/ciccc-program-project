import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck, Lock } from 'lucide-react';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notifications';
import { useNotificationRealtime } from '../hooks/useRealtime';
import { useAppStore } from '../store/app';
import Button from '../components/ui/Button';
import { PageSpinner } from '../components/ui/Spinner';
import { relativeTime, cn } from '../lib/utils';

export default function Notifications() {
  const { t } = useTranslation();
  const token = useAppStore((s) => s.token);
  const qc = useQueryClient();

  useNotificationRealtime();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', { unreadOnly: false }],
    queryFn: () => listNotifications({ limit: 50 }),
    enabled: !!token,
  });

  const markOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
        <Lock className="w-12 h-12 text-muted opacity-40" />
        <p className="text-muted">{t('errors.unauthorized')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground">{t('notifications.title')}</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted mt-0.5">
              {t('notifications.unread', { count: unreadCount })}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            loading={markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            <CheckCheck className="w-4 h-4" />
            {t('notifications.markAllRead')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : !notifications?.length ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Bell className="w-12 h-12 text-muted opacity-30" />
          <p className="text-muted text-sm">{t('notifications.empty')}</p>
        </div>
      ) : (
        <div className="bg-surface border border-edge/12 rounded-2xl overflow-hidden">
          {notifications.map((n, i) => (
            <div
              key={n.id}
              className={cn(
                'px-5 py-4 flex items-start gap-4 transition-colors',
                i < notifications.length - 1 && 'border-b border-edge/12',
                !n.isRead && 'bg-brand/4 hover:bg-brand/6 cursor-pointer',
                n.isRead && 'hover:bg-surface-2 cursor-default',
              )}
              onClick={() => !n.isRead && markOne.mutate(n.id)}
            >
              {/* Unread dot */}
              <div className="flex-shrink-0 mt-1.5">
                {!n.isRead ? (
                  <span className="w-2 h-2 rounded-full bg-brand block" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-transparent block" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={cn('text-sm', n.isRead ? 'text-muted' : 'font-semibold text-foreground')}>
                  {n.title}
                </p>
                {n.body && <p className="text-xs text-muted mt-0.5 leading-relaxed">{n.body}</p>}
              </div>

              <span className="text-xs text-muted flex-shrink-0">{relativeTime(n.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
