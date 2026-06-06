'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, Clock, ArrowLeftRight,
  BarChart2, Bell, FileText, Settings, User,
  LogOut, ChevronLeft, ChevronRight, Shield, X, Users, Timer,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const userNavItems = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/schedule',      label: 'Schedule',      icon: Calendar },
  { href: '/availability',  label: 'Availability',  icon: Clock },
  { href: '/requests',      label: 'Requests',      icon: ArrowLeftRight },
  { href: '/analytics',     label: 'Analytics',     icon: BarChart2 },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/reports',       label: 'Reports',       icon: FileText },
  { href: '/settings',      label: 'Settings',      icon: Settings },
  { href: '/profile',       label: 'Profile',       icon: User },
];

const adminNavItems = [
  { href: '/dashboard',     label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/schedule',      label: 'Schedule',      icon: Calendar },
  { href: '/users',         label: 'Users',         icon: Users },
  { href: '/sessions',      label: 'Sessions',      icon: Timer },
  { href: '/availability',  label: 'Availability',  icon: Clock },
  { href: '/requests',      label: 'Requests',      icon: ArrowLeftRight },
  { href: '/analytics',     label: 'Analytics',     icon: BarChart2 },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/reports',       label: 'Reports',       icon: FileText },
  { href: '/settings',      label: 'Settings',      icon: Settings },
  { href: '/profile',       label: 'Profile',       icon: User },
];

function NavItems({ onClose, collapsed = false }: { onClose?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { toggleCollapsed } = useUIStore();
  const navItems = user?.role === 'admin' ? adminNavItems : userNavItems;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/login');
  };

  return (
    <>
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        {!collapsed && (
          <span className="font-semibold text-slate-900 dark:text-white whitespace-nowrap">
            ShiftOS
          </span>
        )}
        {onClose && (
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          const isNotif = href === '/notifications';
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                active
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <div className="relative shrink-0">
                <Icon className={cn(
                  'w-5 h-5',
                  active
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                )} />
                {isNotif && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              {!collapsed && <span className="whitespace-nowrap">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-slate-100 dark:border-slate-800 space-y-1 shrink-0">
        {user?.role === 'admin' && !collapsed && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 text-xs font-medium">
            <Shield className="w-3.5 h-3.5" /> Admin
          </div>
        )}
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
              <span className="text-blue-700 dark:text-blue-300 text-xs font-semibold">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5 shrink-0 text-slate-400" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );
}

export default function Sidebar() {
  const { sidebarCollapsed, toggleCollapsed, sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <>
      <aside
        style={{ width: sidebarCollapsed ? 64 : 240 }}
        className="hidden lg:flex fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex-col z-40 shadow-sm overflow-hidden transition-all duration-200"
      >
        <NavItems collapsed={sidebarCollapsed} />
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm hover:bg-slate-50"
        >
          {sidebarCollapsed
            ? <ChevronRight className="w-3 h-3 text-slate-500" />
            : <ChevronLeft className="w-3 h-3 text-slate-500" />
          }
        </button>
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-slate-900 z-50 flex flex-col shadow-xl lg:hidden"
            >
              <NavItems onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
