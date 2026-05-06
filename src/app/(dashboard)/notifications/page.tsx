'use client';

import { useEffect } from 'react';
import { useNotificationStore } from '@/store/notificationStore';
import { Notification } from '@/types';
import { Loader2, Bell, CheckCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const typeColors: Record<string, string> = {
  shift_assigned:        'bg-blue-100 text-blue-700',
  shift_updated:         'bg-blue-100 text-blue-700',
  shift_cancelled:       'bg-red-100 text-red-700',
  exchange_requested:    'bg-purple-100 text-purple-700',
  exchange_accepted:     'bg-green-100 text-green-700',
  exchange_rejected:     'bg-red-100 text-red-700',
  exchange_approved:     'bg-green-100 text-green-700',
  leave_approved:        'bg-green-100 text-green-700',
  leave_rejected:        'bg-red-100 text-red-700',
  session_approved:      'bg-green-100 text-green-700',
  session_rejected:      'bg-red-100 text-red-700',
  availability_approved: 'bg-green-100 text-green-700',
  availability_rejected: 'bg-red-100 text-red-700',
  general:               'bg-slate-100 text-slate-700',
};

const typeLabels: Record<string, string> = {
  shift_assigned:        'Shift',
  shift_updated:         'Shift',
  shift_cancelled:       'Shift',
  exchange_requested:    'Exchange',
  exchange_accepted:     'Exchange',
  exchange_rejected:     'Exchange',
  exchange_approved:     'Exchange',
  leave_approved:        'Leave',
  leave_rejected:        'Leave',
  session_approved:      'Session',
  session_rejected:      'Session',
  availability_approved: 'Availability',
  availability_rejected: 'Availability',
  general:               'General',
};

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, unreadCount, isLoading, fetchNotifications, markAllRead, markRead } =
    useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleClick = async (notification: Notification) => {
    if (!notification.read) await markRead(notification._id);
    if (notification.link) router.push(notification.link);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
          <p className="text-slate-500 text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="text-xs">
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No notifications yet</p>
            <p className="text-slate-400 text-sm mt-1">
              You&apos;ll see updates about shifts, requests, and approvals here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => (
            <motion.div
              key={n._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card
                className={cn(
                  'border-0 shadow-sm cursor-pointer hover:shadow-md transition-all',
                  !n.read && 'bg-blue-50/60 border-l-4 border-l-blue-500'
                )}
                onClick={() => handleClick(n)}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    {/* Dot */}
                    <div className="mt-1.5">
                      {!n.read
                        ? <div className="w-2 h-2 rounded-full bg-blue-500" />
                        : <div className="w-2 h-2 rounded-full bg-slate-200" />
                      }
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          typeColors[n.type] || typeColors.general
                        )}>
                          {typeLabels[n.type] || 'General'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {format(new Date(n.createdAt), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <p className={cn(
                        'text-sm',
                        n.read ? 'text-slate-600' : 'text-slate-900 font-medium'
                      )}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                    </div>

                    {/* Arrow if has link */}
                    {n.link && (
                      <ArrowRight className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
