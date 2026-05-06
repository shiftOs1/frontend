'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { sessionApi } from '@/lib/api';
import { Loader2, Download, FileText, Table, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export default function ReportsPage() {
  const { user } = useAuthStore();
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const { data } = await sessionApi.getMy({ limit: '200' });
      const filtered = (data.data.data || []).filter((s: any) => {
        const d = new Date(s.clockIn);
        return d >= new Date(startDate) && d <= new Date(endDate);
      });
      setSessions(filtered);
      setGenerated(true);
    } catch {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const totalHours = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) / 60;
  const overtimeHours = sessions.reduce((sum, s) => sum + (s.overtimeMinutes || 0), 0) / 60;

  const exportCSV = () => {
    const headers = ['Date', 'Clock In', 'Clock Out', 'Break (min)', 'Duration (h)', 'Overtime (h)', 'Status'];
    const rows = sessions.map((s) => [
      format(new Date(s.clockIn), 'yyyy-MM-dd'),
      format(new Date(s.clockIn), 'HH:mm'),
      s.clockOut ? format(new Date(s.clockOut), 'HH:mm') : '-',
      s.breakMinutes,
      ((s.durationMinutes || 0) / 60).toFixed(2),
      ((s.overtimeMinutes || 0) / 60).toFixed(2),
      s.status,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shiftos-report-${startDate}-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shiftos-report-${startDate}-${endDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSON exported');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Reports</h1>
        <p className="text-slate-500 text-sm mt-1">Generate and export your work hour reports</p>
      </div>

      {/* Date range picker */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Select Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Start date</Label>
              <Input type="date" value={startDate}
                onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End date</Label>
              <Input type="date" value={endDate}
                onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={fetchSessions} disabled={loading}>
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                : 'Generate Report'
              }
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      {generated && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Total Sessions', value: sessions.length, color: 'bg-blue-600' },
              { label: 'Total Hours', value: `${totalHours.toFixed(1)}h`, color: 'bg-green-500' },
              { label: 'Overtime Hours', value: `${overtimeHours.toFixed(1)}h`, color: 'bg-amber-500' },
              { label: 'Approved', value: sessions.filter(s => s.status === 'approved').length, color: 'bg-purple-500' },
            ].map((stat, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="pt-4 pb-4 text-center">
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Export buttons */}
          <div className="flex gap-3 mb-6">
            <Button variant="outline" onClick={exportCSV}>
              <Table className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <Button variant="outline" onClick={exportJSON}>
              <FileText className="w-4 h-4 mr-2" /> Export JSON
            </Button>
          </div>

          {/* Sessions table */}
          {sessions.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-12 text-center">
                <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No sessions found for this period</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Date', 'Clock In', 'Clock Out', 'Break', 'Duration', 'Overtime', 'Status'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sessions.map((s, i) => (
                      <motion.tr
                        key={s._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {format(new Date(s.clockIn), 'MMM d, yyyy')}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {format(new Date(s.clockIn), 'HH:mm')}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {s.clockOut ? format(new Date(s.clockOut), 'HH:mm') : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{s.breakMinutes}m</td>
                        <td className="px-4 py-3 text-slate-600">
                          {((s.durationMinutes || 0) / 60).toFixed(1)}h
                        </td>
                        <td className="px-4 py-3">
                          {s.overtimeMinutes > 0
                            ? <span className="text-amber-600 font-medium">+{((s.overtimeMinutes || 0) / 60).toFixed(1)}h</span>
                            : <span className="text-slate-400">—</span>
                          }
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            s.status === 'approved' ? 'bg-green-100 text-green-700' :
                            s.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            s.status === 'active' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {s.status.replace('_', ' ')}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}
