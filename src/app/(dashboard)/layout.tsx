'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import SocketProvider from '@/components/providers/SocketProvider';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, fetchMe } = useAuthStore();
  const { sidebarCollapsed } = useUIStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/login');
      return;
    }
    fetchMe()
      .catch(() => router.replace('/login'))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <p className="text-sm text-slate-500">Loading ShiftOS...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <SocketProvider>
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <Navbar />
        {/* On mobile: no left margin (sidebar is a drawer overlay)
            On desktop: left margin matches sidebar width */}
        <main className={cn(
          'pt-16 min-h-screen transition-all duration-200',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'
        )}>
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </SocketProvider>
  );
}
