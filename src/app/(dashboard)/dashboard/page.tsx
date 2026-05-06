'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { analyticsApi, sessionApi } from '@/lib/api';
import { AnalyticsSummary, WorkSession } from '@/types';
import { 
  Users, Clock, TrendingUp, AlertCircle, 
 CheckCircle, Timer, Calendar, ArrowUpRight 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const StatCard = ({
  title, value, subtitle, icon: Icon, color, delay,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
  >
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [myStats, setMyStats] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<WorkSession | null>(null);
  const [clockLoading, setClockLoading] = useState(false);
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (isAdmin) {
      analyticsApi.getSummary().then((r) => setSummary(r.data.data)).catch(() => {});
    } else {
      analyticsApi.getMyStats().then((r) => setMyStats(r.data.data)).catch(() => {});
    }
    loadActiveSession();
  }, []);

  // Live clock for active session
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      const diff = Date.now() - new Date(activeSession.clockIn).getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setElapsed(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const loadActiveSession = async () => {
    try {
      const { data } = await sessionApi.getMy({ status: 'active', limit: '1' });
      const active = data.data.data?.find((s: WorkSession) => s.status === 'active');
      setActiveSession(active || null);
    } catch {}
  };

  const handleClockIn = async () => {
    setClockLoading(true);
    try {
      const { data } = await sessionApi.clockIn();
      setActiveSession(data.data.session);
      toast.success('Clocked in! Have a great shift.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to clock in');
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = async () => {
    setClockLoading(true);
    try {
      await sessionApi.clockOut();
      setActiveSession(null);
      setElapsed('');
      toast.success('Clocked out. Session submitted for approval.');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to clock out');
    } finally {
      setClockLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
      </div>

      {/* Clock in/out widget */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardContent className="pt-6 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Work Session</p>
                {activeSession ? (
                  <>
                    <p className="text-3xl font-bold font-mono mt-1">{elapsed || '00:00:00'}</p>
                    <p className="text-blue-200 text-xs mt-1">
                      Started at {format(new Date(activeSession.clockIn), 'HH:mm')}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold mt-1">Not clocked in</p>
                    <p className="text-blue-200 text-xs mt-1">Click to start your shift</p>
                  </>
                )}
              </div>
              <Button
                onClick={activeSession ? handleClockOut : handleClockIn}
                disabled={clockLoading}
                variant="secondary"
                className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-6"
              >
                {clockLoading ? 'Loading...' : activeSession ? 'Clock Out' : 'Clock In'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Admin stats */}
      {isAdmin && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Employees" value={summary.totalEmployees} icon={Users} color="bg-blue-600" delay={0.15} />
          <StatCard title="Active Now" value={summary.activeSessionsCount} subtitle="currently working" icon={Timer} color="bg-green-500" delay={0.2} />
          <StatCard title="Monthly Hours" value={`${summary.monthlyHours}h`} subtitle="approved sessions" icon={Clock} color="bg-purple-500" delay={0.25} />
          <StatCard title="Pending Approvals" value={summary.pendingApprovalsCount} subtitle="need review" icon={AlertCircle} color="bg-amber-500" delay={0.3} />
        </div>
      )}

      {/* User stats */}
      {!isAdmin && myStats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="This Week" value={`${myStats.weekly?.hours}h`} subtitle={`${myStats.weekly?.overtimeHours}h overtime`} icon={Clock} color="bg-blue-600" delay={0.15} />
          <StatCard title="This Month" value={`${myStats.monthly?.hours}h`} subtitle={`${myStats.monthly?.sessions} sessions`} icon={TrendingUp} color="bg-green-500" delay={0.2} />
          <StatCard title="All Time" value={`${myStats.allTime?.hours}h`} subtitle={`${myStats.allTime?.sessions} total sessions`} icon={CheckCircle} color="bg-purple-500" delay={0.25} />
        </div>
      )}
    </div>
  );
}
