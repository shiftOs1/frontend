'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { exchangeApi, leaveApi } from '@/lib/api';
import { ExchangeRequest, LeaveRequest } from '@/types';
import { toast } from 'sonner';
import {
  Plus, X, Loader2, ArrowLeftRight, Calendar,
  CheckCircle, XCircle, AlertCircle, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const statusConfig: Record<string, { color: string; icon: React.ElementType }> = {
  pending:   { color: 'bg-amber-100 text-amber-700',  icon: AlertCircle },
  approved:  { color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  accepted:  { color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  rejected:  { color: 'bg-red-100 text-red-700',      icon: XCircle },
  cancelled: { color: 'bg-slate-100 text-slate-600',  icon: XCircle },
};

const leaveTypes = ['vacation', 'sick', 'personal', 'unpaid', 'other'];

export default function RequestsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [exchanges, setExchanges] = useState<ExchangeRequest[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respondingType, setRespondingType] = useState<'exchange' | 'leave' | null>(null);
  const [adminComment, setAdminComment] = useState('');

  const [leaveForm, setLeaveForm] = useState({
    type: 'vacation',
    startDate: '',
    endDate: '',
    reason: '',
  });

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [exRes, lvRes] = await Promise.all([
        exchangeApi.getMy(),
        isAdmin ? leaveApi.getAll() : leaveApi.getMy(),
      ]);
      setExchanges(exRes.data.data.exchanges || []);
      setLeaves(lvRes.data.data.leaves || []);
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await leaveApi.request(leaveForm);
      toast.success('Leave request submitted');
      setShowLeaveModal(false);
      setLeaveForm({ type: 'vacation', startDate: '', endDate: '', reason: '' });
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit');
    } finally {
      setSaving(false);
    }
  };

  const handleRespondLeave = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await leaveApi.respond(id, status, adminComment);
      toast.success(`Leave ${status}`);
      setRespondingId(null);
      setAdminComment('');
      fetchAll();
    } catch {
      toast.error('Failed to respond');
    }
  };

  const handleRespondExchange = async (id: string, response: 'accepted' | 'rejected') => {
    try {
      await exchangeApi.respond(id, response);
      toast.success(`Exchange ${response}`);
      fetchAll();
    } catch {
      toast.error('Failed to respond');
    }
  };

  const handleAdminApproveExchange = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await exchangeApi.approve(id, status, adminComment);
      toast.success(`Exchange ${status}`);
      setRespondingId(null);
      setAdminComment('');
      fetchAll();
    } catch {
      toast.error('Failed to respond');
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const cfg = statusConfig[status] || statusConfig.pending;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${cfg.color}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Requests</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isAdmin ? 'Manage all employee requests' : 'Submit and track your requests'}
          </p>
        </div>
        {!isAdmin && (
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowLeaveModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Leave Request
          </Button>
        )}
      </div>

      <Tabs defaultValue="leaves">
        <TabsList className="bg-slate-100">
          <TabsTrigger value="leaves" className="data-[state=active]:bg-white">
            <Calendar className="w-4 h-4 mr-2" />
            Leave Requests
            {leaves.filter(l => l.status === 'pending').length > 0 && (
              <span className="ml-2 bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {leaves.filter(l => l.status === 'pending').length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="exchanges" className="data-[state=active]:bg-white">
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            Shift Exchanges
          </TabsTrigger>
        </TabsList>

        {/* Leave Requests */}
        <TabsContent value="leaves" className="mt-4">
          {leaves.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">No leave requests</p>
                {!isAdmin && (
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => setShowLeaveModal(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Submit Request
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {leaves.map((leave, i) => (
                <motion.div
                  key={leave._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-0 shadow-sm">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 capitalize">{leave.type} Leave</span>
                            <StatusBadge status={leave.status} />
                          </div>
                          {isAdmin && (leave.user as any)?.name && (
                            <p className="text-xs text-slate-400">{(leave.user as any).name}</p>
                          )}
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {format(new Date(leave.startDate), 'MMM d')} – {format(new Date(leave.endDate), 'MMM d, yyyy')}
                          </div>
                          {leave.reason && (
                            <p className="text-xs text-slate-500 mt-1">{leave.reason}</p>
                          )}
                          {leave.adminComment && (
                            <p className="text-xs text-slate-500 italic border-l-2 border-slate-200 pl-2 mt-1">
                              Admin: {leave.adminComment}
                            </p>
                          )}
                        </div>

                        {/* Admin respond */}
                        {isAdmin && leave.status === 'pending' && (
                          <div className="shrink-0">
                            {respondingId === leave._id ? (
                              <div className="space-y-2 w-48">
                                <Input
                                  placeholder="Comment (optional)"
                                  value={adminComment}
                                  onChange={(e) => setAdminComment(e.target.value)}
                                  className="text-xs"
                                />
                                <div className="flex gap-1">
                                  <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                                    onClick={() => handleRespondLeave(leave._id, 'approved')}>
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" className="flex-1 text-xs"
                                    onClick={() => handleRespondLeave(leave._id, 'rejected')}>
                                    Reject
                                  </Button>
                                </div>
                                <Button size="sm" variant="ghost" className="w-full text-xs"
                                  onClick={() => setRespondingId(null)}>
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" className="text-xs"
                                onClick={() => { setRespondingId(leave._id); setRespondingType('leave'); }}>
                                Review
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Exchanges */}
        <TabsContent value="exchanges" className="mt-4">
          {exchanges.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <ArrowLeftRight className="w-12 h-12 text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">No exchange requests</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {exchanges.map((ex, i) => (
                <motion.div
                  key={ex._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-0 shadow-sm">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">Shift Exchange</span>
                            <StatusBadge status={ex.status} />
                          </div>
                          <p className="text-xs text-slate-500">
                            From: {(ex.initiator as any)?.name} → To: {(ex.targetUser as any)?.name}
                          </p>
                          {ex.message && (
                            <p className="text-xs text-slate-500">{ex.message}</p>
                          )}
                          <p className="text-xs text-slate-400">
                            {format(new Date(ex.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>

                        {/* Target user respond */}
                        {!isAdmin &&
                          ex.status === 'pending' &&
                          (ex.targetUser as any)?._id === user?._id && (
                          <div className="flex gap-2 shrink-0">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs"
                              onClick={() => handleRespondExchange(ex._id, 'accepted')}>
                              Accept
                            </Button>
                            <Button size="sm" variant="destructive" className="text-xs"
                              onClick={() => handleRespondExchange(ex._id, 'rejected')}>
                              Reject
                            </Button>
                          </div>
                        )}

                        {/* Admin approve accepted exchange */}
                        {isAdmin && ex.status === 'accepted' && (
                          <div className="shrink-0">
                            {respondingId === ex._id ? (
                              <div className="space-y-2 w-48">
                                <Input
                                  placeholder="Comment (optional)"
                                  value={adminComment}
                                  onChange={(e) => setAdminComment(e.target.value)}
                                  className="text-xs"
                                />
                                <div className="flex gap-1">
                                  <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                                    onClick={() => handleAdminApproveExchange(ex._id, 'approved')}>
                                    Approve
                                  </Button>
                                  <Button size="sm" variant="destructive" className="flex-1 text-xs"
                                    onClick={() => handleAdminApproveExchange(ex._id, 'rejected')}>
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button size="sm" variant="outline" className="text-xs"
                                onClick={() => setRespondingId(ex._id)}>
                                Review
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Leave request modal */}
      <AnimatePresence>
        {showLeaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowLeaveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Leave Request</h2>
                <button onClick={() => setShowLeaveModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleLeaveSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Leave type</Label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={leaveForm.type}
                    onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
                  >
                    {leaveTypes.map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Start date</Label>
                    <Input type="date" value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>End date</Label>
                    <Input type="date" value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Reason <span className="text-slate-400 text-xs">(optional)</span></Label>
                  <Input placeholder="Brief reason for leave..."
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1"
                    onClick={() => setShowLeaveModal(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={saving}>
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : 'Submit'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
