import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const connectSocket = (accessToken: string): Socket => {
  const s = getSocket();
  s.auth = { token: accessToken };
  if (!s.connected) s.connect();
  return s;
};

export const disconnectSocket = (): void => {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
};

export const SocketEvents = {
  NOTIFICATION_NEW:      'notification:new',
  SHIFT_CREATED:         'shift:created',
  SHIFT_UPDATED:         'shift:updated',
  SHIFT_DELETED:         'shift:deleted',
  SHIFT_ASSIGNED:        'shift:assigned',
  SHIFT_CANCELLED:       'shift:cancelled',
  SESSION_STARTED:       'session:started',
  SESSION_ENDED:         'session:ended',
  SESSION_APPROVED:      'session:approved',
  SESSION_REJECTED:      'session:rejected',
  EXCHANGE_REQUESTED:    'exchange:requested',
  EXCHANGE_RESPONDED:    'exchange:responded',
  EXCHANGE_APPROVED:     'exchange:approved',
  LEAVE_RESPONDED:       'leave:responded',
  AVAILABILITY_RESPONDED:'availability:responded',
  DASHBOARD_REFRESH:     'dashboard:refresh',
} as const;
