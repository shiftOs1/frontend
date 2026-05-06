'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Calendar, Clock, ArrowLeftRight,
  BarChart2, Bell, FileText, Settings, User,
  LogOut, ChevronLeft, ChevronRight, Shield, X,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const navItems = [
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

function NavItems({ onClose, collapsed = false }: { onClose?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { toggleCollapsed } = useUIStore();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    router.push('/login');
  };

  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-100 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        {!collapsed && (
          <span className="font-semibold text-slate-900 whitespace-nowrap">ShiftOS</span>
        )}
        {onClose && (
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
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
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <div className="relative shrink-0">
                <Icon className={cn('w-5 h-5', active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600')} />
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

      {/* Bottom */}
      <div className="p-2 border-t border-slate-100 space-y-1 shrink-0">
        {user?.role === 'admin' && !collapsed && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium">
            <Shield className="w-3.5 h-3.5" /> Admin
          </div>
        )}
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-blue-700 text-xs font-semibold">
                {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
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
      {/* ── DESKTOP only — hidden on mobile ─────────────────────────── */}
      <aside
        style={{ width: sidebarCollapsed ? 64 : 240 }}
        className="hidden lg:flex fixed left-0 top-0 h-full bg-white border-r border-slate-100 flex-col z-40 shadow-sm overflow-hidden transition-all duration-200"
      >
        <NavItems collapsed={sidebarCollapsed} />

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm hover:bg-slate-50"
        >
          {sidebarCollapsed
            ? <ChevronRight className="w-3 h-3 text-slate-500" />
            : <ChevronLeft className="w-3 h-3 text-slate-500" />
          }
        </button>
      </aside>

      {/* ── MOBILE drawer — only shown when sidebarOpen is true ─────── */}
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
              className="fixed left-0 top-0 h-full w-64 bg-white z-50 flex flex-col shadow-xl lg:hidden"
            >
              <NavItems onClose={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
