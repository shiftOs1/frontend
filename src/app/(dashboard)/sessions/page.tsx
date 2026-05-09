'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { sessionApi } from '@/lib/api';
import { WorkSession } from '@/types';
import { toast } from 'sonner';
import {
  Loader2, Clock, CheckCircle, XCircle,
  AlertCircle, Timer, Calendar, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { format, formatDuration, intervalToDuration } from 'date-fns';

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  active:           { color: 'bg-blue-100 text-blue-700',   icon: Timer,        label: 'Active' },
  pending_approval: { color: 'bg-amber-100 text-amber-700', icon: AlertCircle,  label: 'Pending' },
  approved:         { color: 'bg-green-100 text-green-700', icon: CheckCircle,  label: 'Approved' },
  rejected:         { color: 'bg-red-100 text-red-700',     icon: XCircle,      label: 'Rejected' },
};

const formatMinutes = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

export default function SessionsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const isAdmin = user?.role === 'admin';

  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [activeSessions, setActiveSessions] = useState<WorkSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [tab, setTab] = useState('pending');

  useEffect(() => {
    fetchSessions();
  }, [tab]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const [allRes, activeRes] = await Promise.all([
          sessionApi.getAll({ status: tab === 'active' ? 'active' : tab === 'pending' ? 'pending_approval' : tab }),
          tab === 'active' ? sessionApi.getActive() : Promise.resolve(null),
        ]);
        setSessions(allRes.data.data.data || []);
        if (activeRes) setActiveSessions(activeRes.data.data.sessions || []);
      } else {
        const { data } = await sessionApi.getMy();
        setSessions(data.data.data || []);
      }
    } catch {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await sessionApi.approve(id, comment);
      toast.success('Session approved');
      setRespondingId(null);
      setComment('');
      fetchSessions();
    } catch {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (id: string) => {
    if (!comment.trim()) {
      toast.error('Please add a comment when rejecting');
      return;
    }
    try {
      await sessionApi.reject(id, comment);
      toast.success('Session rejected');
      setRespondingId(null);
      setComment('');
      fetchSessions();
    } catch {
      toast.error('Failed to reject');
    }
  };

  const initials = (name: string) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const SessionCard = ({ session, index }: { session: WorkSession; index: number }) => {
    const cfg = statusConfig[session.status] || statusConfig.pending_approval;
    const Icon = cfg.icon;
    const sessionUser = session.user as any;

    return (
      <motion.div
        key={session._id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
      >
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              {isAdmin && (
                <Avatar className="w-9 h-9 shrink-0">
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                    {initials(sessionUser?.name || 'U')}
                  </AvatarFallback>
                </Avatar>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {isAdmin && (
                    <span className="font-medium text-slate-900">{sessionUser?.name}</span>
                  )}
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                  {session.isOvertime && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                      Overtime +{formatMinutes(session.overtimeMinutes)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Date</p>
                    <p className="font-medium text-slate-900">
                      {format(new Date(session.clockIn), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Clock in</p>
                    <p className="font-medium text-slate-900">
                      {format(new Date(session.clockIn), 'HH:mm')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Clock out</p>
                    <p className="font-medium text-slate-900">
                      {session.clockOut ? format(new Date(session.clockOut), 'HH:mm') : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Duration</p>
                    <p className="font-medium text-slate-900">
                      {session.durationMinutes ? formatMinutes(session.durationMinutes) : '—'}
                    </p>
                  </div>
                </div>

                {session.adminComment && (
                  <p className="text-xs text-slate-500 italic border-l-2 border-slate-200 pl-2">
                    {session.adminComment}
                  </p>
                )}

                {/* Admin actions */}
                {isAdmin && session.status === 'pending_approval' && (
                  <div className="pt-1">
                    {respondingId === session._id ? (
                      <div className="space-y-2">
                        <Input
                          placeholder="Comment (required for rejection, optional for approval)"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="text-xs"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-xs"
                            onClick={() => handleApprove(session._id)}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" /> Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="text-xs"
                            onClick={() => handleReject(session._id)}
                          >
                            <XCircle className="w-3 h-3 mr-1" /> Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs"
                            onClick={() => { setRespondingId(null); setComment(''); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => setRespondingId(session._id)}
                      >
                        Review session
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Work Sessions</h1>
        <p className="text-slate-500 text-sm mt-1">
          {isAdmin ? 'Review and approve employee work sessions' : 'Your work session history'}
        </p>
      </div>

      {isAdmin ? (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-slate-100">
            <TabsTrigger value="pending" className="data-[state=active]:bg-white">
              Pending
            </TabsTrigger>
            <TabsTrigger value="active" className="data-[state=active]:bg-white">
              Active Now
            </TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-white">
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:bg-white">
              Rejected
            </TabsTrigger>
          </TabsList>

          {['pending', 'active', 'approved', 'rejected'].map((t) => (
            <TabsContent key={t} value={t} className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : sessions.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Clock className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">No {t} sessions</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {sessions.map((s, i) => <SessionCard key={s._id} session={s} index={i} />)}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : sessions.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Clock className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">No sessions yet</p>
                <p className="text-slate-400 text-sm mt-1">Clock in from the dashboard to start tracking</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sessions.map((s, i) => <SessionCard key={s._id} session={s} index={i} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
