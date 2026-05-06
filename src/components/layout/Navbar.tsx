'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Menu } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { unreadCount, fetchNotifications } = useNotificationStore();
  const { sidebarCollapsed, setSidebarOpen } = useUIStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const initials = user?.name
    ?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <header className={cn(
      'fixed top-0 right-0 h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 sm:px-6 z-30 transition-all duration-200',
      'left-0 lg:left-auto',
      sidebarCollapsed ? 'lg:left-16' : 'lg:left-60'
    )}>
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-5 h-5 text-slate-500" />
        </Button>

        {/* Logo on mobile */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          <span className="font-semibold text-slate-900 text-sm">ShiftOS</span>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => router.push('/notifications')}
        >
          <Bell className="w-5 h-5 text-slate-500" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {/* Avatar */}
        <div
          className="flex items-center gap-2 ml-1 cursor-pointer"
          onClick={() => router.push('/profile')}
        >
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-900 leading-none">{user?.name}</p>
            <p className="text-xs text-slate-400 mt-0.5 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
