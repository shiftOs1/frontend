'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { connectSocket, disconnectSocket, getSocket, SocketEvents } from '@/lib/socket';
import { Notification } from '@/types';
import { toast } from 'sonner';

export const useSocket = () => {
  const { accessToken, isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return;

    const socket = connectSocket(accessToken);

    // ── Notification events ───────────────────────────────────────────────────
    socket.on(SocketEvents.NOTIFICATION_NEW, (notification: Notification) => {
      addNotification(notification);
      toast(notification.title, {
        description: notification.body,
        duration: 5000,
      });
    });

    // ── Shift events ──────────────────────────────────────────────────────────
    socket.on(SocketEvents.SHIFT_ASSIGNED, (data: any) => {
      toast.success('New shift assigned', { description: data?.message });
    });

    socket.on(SocketEvents.SHIFT_UPDATED, (data: any) => {
      toast.info('Shift updated', { description: data?.message });
    });

    socket.on(SocketEvents.SHIFT_CANCELLED, (data: any) => {
      toast.warning('Shift cancelled', { description: data?.message });
    });

    // ── Session events ────────────────────────────────────────────────────────
    socket.on(SocketEvents.SESSION_APPROVED, () => {
      toast.success('Work session approved!');
    });

    socket.on(SocketEvents.SESSION_REJECTED, () => {
      toast.error('Work session rejected');
    });

    // ── Exchange events ───────────────────────────────────────────────────────
    socket.on(SocketEvents.EXCHANGE_REQUESTED, () => {
      toast.info('New shift exchange request received');
    });

    socket.on(SocketEvents.EXCHANGE_RESPONDED, (data: any) => {
      toast.info('Exchange request responded', { description: data?.message });
    });

    // ── Leave events ──────────────────────────────────────────────────────────
    socket.on(SocketEvents.LEAVE_RESPONDED, (data: any) => {
      toast.info('Leave request updated', { description: data?.message });
    });

    // ── Connection events ─────────────────────────────────────────────────────
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });

    return () => {
      socket.off(SocketEvents.NOTIFICATION_NEW);
      socket.off(SocketEvents.SHIFT_ASSIGNED);
      socket.off(SocketEvents.SHIFT_UPDATED);
      socket.off(SocketEvents.SHIFT_CANCELLED);
      socket.off(SocketEvents.SESSION_APPROVED);
      socket.off(SocketEvents.SESSION_REJECTED);
      socket.off(SocketEvents.EXCHANGE_REQUESTED);
      socket.off(SocketEvents.EXCHANGE_RESPONDED);
      socket.off(SocketEvents.LEAVE_RESPONDED);
    };
  }, [isAuthenticated, accessToken]);
};
