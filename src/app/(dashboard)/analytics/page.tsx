'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { analyticsApi } from '@/lib/api';
import { AnalyticsSummary, UserHours } from '@/types';
import { Loader2, Users, Clock, TrendingUp, AlertCircle, CheckCircle, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie,
  Cell, Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

const StatCard = ({
  title, value, subtitle, icon: Icon, color, delay = 0,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    <Card className="border-0 shadow-sm">
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

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [myStats, setMyStats] = useState<any>(null);
  const [hoursData, setHoursData] = useState<any[]>([]);
  const [userHours, setUserHours] = useState<UserHours[]>([]);
  const [attendance, setAttendance] = useState<any>(null);
  const [shiftStats, setShiftStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const [sumRes, hoursRes, usersRes, attendRes, shiftRes] = await Promise.all([
          analyticsApi.getSummary(),
          analyticsApi.getHours({ period }),
          analyticsApi.getUsers(),
          analyticsApi.getAttendance(),
          analyticsApi.getShiftStats(),
        ]);
        setSummary(sumRes.data.data);
        setHoursData(hoursRes.data.data);
        setUserHours(usersRes.data.data);
        setAttendance(attendRes.data.data);
        setShiftStats(shiftRes.data.data);
      } else {
        const { data } = await analyticsApi.getMyStats();
        setMyStats(data.data);
      }
    } catch {
      // silently fail — empty state shown
    } finally {
      setLoading(false);
    }
  };

  // Format hours chart data
  const chartData = hoursData.map((d, i) => ({
    name: `${d.period?.day || d.period?.week || d.period?.month || i + 1}`,
    hours: d.totalHours,
    overtime: d.overtimeHours,
  }));

  // Shift stats pie data
  const pieData = shiftStats.map((s) => ({
    name: s._id.charAt(0).toUpperCase() + s._id.slice(1),
    value: s.count,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">
          {isAdmin ? 'Workforce performance overview' : 'Your personal work statistics'}
        </p>
      </div>

      {/* ── USER VIEW ── */}
      {!isAdmin && myStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="This Week" value={`${myStats.weekly?.hours}h`}
              subtitle={`${myStats.weekly?.overtimeHours}h overtime`}
              icon={Clock} color="bg-blue-600" delay={0.1} />
            <StatCard title="This Month" value={`${myStats.monthly?.hours}h`}
              subtitle={`${myStats.monthly?.sessions} sessions`}
              icon={TrendingUp} color="bg-green-500" delay={0.15} />
            <StatCard title="All Time" value={`${myStats.allTime?.hours}h`}
              subtitle={`${myStats.allTime?.sessions} total sessions`}
              icon={CheckCircle} color="bg-purple-500" delay={0.2} />
          </div>

          {/* Personal hours bar */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Monthly breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: 'Regular hours', value: myStats.monthly?.hours, max: 160, color: 'bg-blue-500' },
                  { label: 'Overtime hours', value: myStats.monthly?.overtimeHours, max: 40, color: 'bg-amber-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-600">{item.label}</span>
                      <span className="font-medium text-slate-900">{item.value}h</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((item.value / item.max) * 100, 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`h-full rounded-full ${item.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── ADMIN VIEW ── */}
      {isAdmin && (
        <div className="space-y-6">
          {/* KPI cards */}
          {summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Employees" value={summary.totalEmployees} icon={Users} color="bg-blue-600" delay={0.05} />
              <StatCard title="Active Now" value={summary.activeSessionsCount} icon={Timer} color="bg-green-500" delay={0.1} />
              <StatCard title="Monthly Hours" value={`${summary.monthlyHours}h`} icon={Clock} color="bg-purple-500" delay={0.15} />
              <StatCard title="Overtime" value={`${summary.overtimeHours}h`} icon={AlertCircle} color="bg-amber-500" delay={0.2} />
            </div>
          )}

          <Tabs defaultValue="hours">
            <TabsList className="bg-slate-100">
              <TabsTrigger value="hours" className="data-[state=active]:bg-white">Hours</TabsTrigger>
              <TabsTrigger value="employees" className="data-[state=active]:bg-white">Employees</TabsTrigger>
              <TabsTrigger value="shifts" className="data-[state=active]:bg-white">Shifts</TabsTrigger>
            </TabsList>

            {/* Hours chart */}
            <TabsContent value="hours" className="mt-4 space-y-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">Hours worked over time</CardTitle>
                  <div className="flex gap-1">
                    {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                          period === p
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  {chartData.length === 0 ? (
                    <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                      No data for this period
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Regular" />
                        <Bar dataKey="overtime" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Overtime" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Attendance */}
              {attendance && (
                <Card className="border-0 shadow-sm">
                  <CardHeader><CardTitle className="text-base">Attendance rate</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="text-4xl font-bold text-slate-900">{attendance.attendanceRate}%</div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>Scheduled shifts</span>
                          <span className="font-medium">{attendance.scheduledShifts}</span>
                        </div>
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>Completed sessions</span>
                          <span className="font-medium">{attendance.completedSessions}</span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden mt-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${attendance.attendanceRate}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full bg-green-500 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Employees tab */}
            <TabsContent value="employees" className="mt-4">
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-base">Hours by employee (this month)</CardTitle></CardHeader>
                <CardContent>
                  {userHours.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
                  ) : (
                    <div className="space-y-4">
                      {userHours.slice(0, 10).map((u, i) => (
                        <div key={u.userId} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium text-slate-900">{u.name}</span>
                            <span className="text-slate-500">{u.totalHours}h
                              {u.overtimeHours > 0 && (
                                <span className="text-amber-500 ml-1">(+{u.overtimeHours}h OT)</span>
                              )}
                            </span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((u.totalHours / 160) * 100, 100)}%` }}
                              transition={{ duration: 0.6, delay: i * 0.05 }}
                              className="h-full bg-blue-500 rounded-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Shifts tab */}
            <TabsContent value="shifts" className="mt-4">
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-base">Shift status breakdown</CardTitle></CardHeader>
                <CardContent>
                  {pieData.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-8">No data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {pieData.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
