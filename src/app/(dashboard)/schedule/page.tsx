'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { shiftApi } from '@/lib/api';
import { Shift } from '@/types';
import { toast } from 'sonner';
import { Plus, MapPin, Clock, User, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

const statusColors: Record<string, string> = {
  open:      'bg-slate-100 text-slate-700',
  assigned:  'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const calendarColors: Record<string, string> = {
  open:      '#94a3b8',
  assigned:  '#3b82f6',
  completed: '#22c55e',
  cancelled: '#ef4444',
};

interface ShiftForm {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  notes: string;
}

const emptyForm: ShiftForm = {
  title: '',
  date: '',
  startTime: '09:00',
  endTime: '17:00',
  location: '',
  notes: '',
};

export default function SchedulePage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [form, setForm] = useState<ShiftForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const endpoint = isAdmin ? shiftApi.getAll() : shiftApi.getMy();
      const { data } = await endpoint;
      setShifts(data.data.data || data.data.shifts || []);
    } catch {
      toast.error('Failed to load shifts');
    } finally {
      setLoading(false);
    }
  };

  const calendarEvents = shifts.map((s) => ({
    id: s._id,
    title: s.title,
    start: `${format(new Date(s.date), 'yyyy-MM-dd')}T${s.startTime}`,
    end:   `${format(new Date(s.date), 'yyyy-MM-dd')}T${s.endTime}`,
    backgroundColor: calendarColors[s.status] || '#3b82f6',
    borderColor: 'transparent',
    extendedProps: { shift: s },
  }));

  const handleEventClick = (info: any) => {
    setSelectedShift(info.event.extendedProps.shift);
  };

  const handleDateClick = (info: any) => {
    if (!isAdmin) return;
    setForm({ ...emptyForm, date: info.dateStr });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await shiftApi.create(form);
      toast.success('Shift created successfully');
      setShowModal(false);
      setForm(emptyForm);
      fetchShifts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create shift');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShift = async (id: string) => {
    try {
      await shiftApi.delete(id);
      toast.success('Shift deleted');
      setSelectedShift(null);
      fetchShifts();
    } catch {
      toast.error('Failed to delete shift');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Schedule</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isAdmin ? 'Manage and assign shifts' : 'View your assigned shifts'}
          </p>
        </div>
        {isAdmin && (
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => { setForm(emptyForm); setShowModal(true); }}
          >
            <Plus className="w-4 h-4 mr-2" /> New Shift
          </Button>
        )}
      </div>

      {/* Calendar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,listWeek',
              }}
              events={calendarEvents}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              height="auto"
              editable={isAdmin}
              selectable={isAdmin}
              eventDisplay="block"
              dayMaxEvents={3}
            />
          )}
        </CardContent>
      </Card>

      {/* Shift detail panel */}
      <AnimatePresence>
        {selectedShift && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className="fixed right-6 top-24 w-80 z-50"
          >
            <Card className="border-0 shadow-xl">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{selectedShift.title}</CardTitle>
                    <Badge className={`mt-1 text-xs ${statusColors[selectedShift.status]}`}>
                      {selectedShift.status}
                    </Badge>
                  </div>
                  <button onClick={() => setSelectedShift(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  {selectedShift.startTime} – {selectedShift.endTime}
                </div>
                {selectedShift.location && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {selectedShift.location}
                  </div>
                )}
                {selectedShift.assignedUser && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <User className="w-4 h-4 text-slate-400" />
                    {(selectedShift.assignedUser as any).name}
                  </div>
                )}
                {selectedShift.notes && (
                  <p className="text-slate-500 text-xs bg-slate-50 rounded p-2">
                    {selectedShift.notes}
                  </p>
                )}
                {isAdmin && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleDeleteShift(selectedShift._id)}
                  >
                    Delete Shift
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create shift modal */}
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
                <h2 className="text-lg font-semibold text-slate-900">Create Shift</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="Morning shift"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Start time</Label>
                    <Input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End time</Label>
                    <Input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Location <span className="text-slate-400 text-xs">(optional)</span></Label>
                  <Input
                    placeholder="Office, Remote..."
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notes <span className="text-slate-400 text-xs">(optional)</span></Label>
                  <Input
                    placeholder="Any additional notes..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    disabled={saving}
                  >
                    {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Create Shift'}
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
