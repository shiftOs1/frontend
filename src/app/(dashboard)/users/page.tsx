'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { User } from '@/types';
import { toast } from 'sonner';
import {
  Search, Loader2, Shield, UserCheck,
  UserX, Trash2, MoreVertical, Mail, Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function UsersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const isAdmin = user?.role === 'admin';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!isAdmin) {
      router.replace('/dashboard');
      return;
    }
    fetchUsers();
  }, [search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users', {
        params: { search, limit: 50 },
      });
      setUsers(data.data.data || []);
      setTotal(data.data.total || 0);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, name: string) => {
    try {
      const { data } = await api.patch(`/users/${userId}/toggle-status`);
      toast.success(`${name} ${data.data.user.isActive ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch {
      toast.error('Failed to update user');
    }
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await api.patch(`/users/${userId}`, { role: newRole });
      toast.success(`Role changed to ${newRole}`);
      fetchUsers();
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    try {
      await api.delete(`/users/${userId}`);
      toast.success(`${name} deleted`);
      fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const initials = (name: string) =>
    name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
          <p className="text-slate-500 text-sm mt-1">{total} total employees</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 max-w-sm shadow-sm">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          placeholder="Search by name or email..."
          className="bg-transparent text-sm text-slate-600 placeholder:text-slate-400 outline-none w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Users list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : users.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-slate-500 font-medium">No users found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {users.map((u, i) => (
            <motion.div
              key={u._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <Avatar className="w-10 h-10 shrink-0">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                        {initials(u.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-slate-900">{u.name}</p>
                        <Badge className={u.role === 'admin'
                          ? 'bg-amber-100 text-amber-700 text-xs'
                          : 'bg-blue-100 text-blue-700 text-xs'
                        }>
                          {u.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                          {u.role}
                        </Badge>
                        <Badge className={u.isActive
                          ? 'bg-green-100 text-green-700 text-xs'
                          : 'bg-slate-100 text-slate-500 text-xs'
                        }>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {!u.isEmailVerified && (
                          <Badge className="bg-red-100 text-red-600 text-xs">
                            Unverified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {u.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Joined {format(new Date(u.createdAt), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => handleToggleRole(u._id, u.role)}
                        disabled={u._id === user?._id}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {u.role === 'admin' ? 'Make User' : 'Make Admin'}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className={`text-xs ${u.isActive
                          ? 'text-amber-600 hover:bg-amber-50'
                          : 'text-green-600 hover:bg-green-50'
                        }`}
                        onClick={() => handleToggleStatus(u._id, u.name)}
                        disabled={u._id === user?._id}
                      >
                        {u.isActive
                          ? <><UserX className="w-3 h-3 mr-1" /> Deactivate</>
                          : <><UserCheck className="w-3 h-3 mr-1" /> Activate</>
                        }
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(u._id, u.name)}
                        disabled={u._id === user?._id}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
