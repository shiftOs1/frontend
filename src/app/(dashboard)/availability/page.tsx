'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { availabilityApi } from '@/lib/api';
import { Availability } from '@/types';
import { toast } from 'sonner';
import { Plus, X, Loader2, Clock, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const statusConfig = {
  pending:  { label: 'Pending',  icon: AlertCircle, color: 'bg-amber-100 text-amber-700' },
  approved: { label: 'Approved', icon: CheckCircle, color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rejected', icon: XCircle,     color: 'bg-red-100 text-red-700' },
};

interface AvailForm {
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
}

const emptyForm: AvailForm = { date: '', startTime: '09:00', endTime: '17:00', notes: '' };

export default function AvailabilityPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [items, setItems] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AvailForm>(emptyForm);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = isAdmin
        ? await availabilityApi.getAll()
        : await availabilityApi.getMy();
      setItems(data.data.availability || []);
    } catch {
      toast.error('Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await availabilityApi.add(form);
      toast.success('Availability submitted');
      setShowModal(false);
      setForm(emptyForm);
      fetchItems();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to submit');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await availabilityApi.delete(id);
      toast.success('Availability removed');
      fetchItems();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleRespond = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await availabilityApi.respond(id, status, comment);
      toast.success(`Availability ${status}`);
      setRespondingId(null);
      setComment('');
      fetchItems();
    } catch {
      toast.error('Failed to respond');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Availability</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isAdmin ? 'Review employee availability requests' : 'Set your available working hours'}
          </p>
        </div>
        {!isAdmin && (
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Availability
          </Button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : items.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No availability records</p>
            <p className="text-slate-400 text-sm mt-1">
              {isAdmin ? 'No employees have submitted availability yet' : 'Add your available hours to get started'}
            </p>
            {!isAdmin && (
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => setShowModal(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Availability
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const cfg = statusConfig[item.status];
            const Icon = cfg.icon;
            return (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-5 pb-5 space-y-3">
                    {/* Date & status */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-900">
                          {format(new Date(item.date), 'EEE, MMM d, yyyy')}
                        </p>
                        {isAdmin && (item.user as any)?.name && (
                          <p className="text-xs text-slate-400 mt-0.5">{(item.user as any).name}</p>
                        )}
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${cfg.color}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400" />
                      {item.startTime} – {item.endTime}
                    </div>

                    {/* Notes */}
                    {item.notes && (
                      <p className="text-xs text-slate-500 bg-slate-50 rounded p-2">{item.notes}</p>
                    )}

                    {/* Admin comment */}
                    {item.adminComment && (
                      <p className="text-xs text-slate-500 italic border-l-2 border-slate-200 pl-2">
                        {item.adminComment}
                      </p>
                    )}

                    {/* Actions */}
                    {isAdmin && item.status === 'pending' && (
                      respondingId === item._id ? (
                        <div className="space-y-2">
                          <Input
                            placeholder="Comment (optional)"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="text-xs"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
                              onClick={() => handleRespond(item._id, 'approved')}>
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="flex-1 text-xs"
                              onClick={() => handleRespond(item._id, 'rejected')}>
                              Reject
                            </Button>
                            <Button size="sm" variant="ghost" className="text-xs"
                              onClick={() => setRespondingId(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="w-full text-xs"
                          onClick={() => setRespondingId(item._id)}>
                          Review
                        </Button>
                      )
                    )}

                    {/* User delete */}
                    {!isAdmin && item.status === 'pending' && (
                      <Button size="sm" variant="outline" className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(item._id)}>
                        Remove
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add availability modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">Add Availability</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Start time</Label>
                    <Input type="time" value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>End time</Label>
                    <Input type="time" value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes <span className="text-slate-400 text-xs">(optional)</span></Label>
                  <Input placeholder="Any notes for the admin..."
                    value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1"
                    onClick={() => setShowModal(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={saving}>
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Submit'}
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
