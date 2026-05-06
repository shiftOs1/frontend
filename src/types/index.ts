
// ── Auth ──────────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'user';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  avatarUrl?: string;
  timezone: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ── Shifts ────────────────────────────────────────────────────────────────────
export type ShiftStatus = 'open' | 'assigned' | 'completed' | 'cancelled';

export interface Shift {
  _id: string;
  title: string;
  assignedUser?: User;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
  status: ShiftStatus;
  isRecurring: boolean;
  recurrenceRule?: string;
  recurrenceGroupId?: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

// ── Availability ──────────────────────────────────────────────────────────────
export type AvailabilityStatus = 'pending' | 'approved' | 'rejected';

export interface Availability {
  _id: string;
  user: User;
  date: string;
  startTime: string;
  endTime: string;
  status: AvailabilityStatus;
  notes?: string;
  adminComment?: string;
  createdAt: string;
}

// ── Work Sessions ─────────────────────────────────────────────────────────────
export type SessionStatus = 'active' | 'pending_approval' | 'approved' | 'rejected';

export interface WorkSession {
  _id: string;
  user: User;
  shift?: Shift;
  clockIn: string;
  clockOut?: string;
  breakMinutes: number;
  durationMinutes?: number;
  isOvertime: boolean;
  overtimeMinutes: number;
  status: SessionStatus;
  adminComment?: string;
  approvedBy?: User;
  approvedAt?: string;
  createdAt: string;
}

// ── Exchange Requests ─────────────────────────────────────────────────────────
export type ExchangeStatus = 'pending' | 'accepted' | 'rejected' | 'approved' | 'cancelled';

export interface ExchangeRequest {
  _id: string;
  initiator: User;
  targetUser: User;
  shiftFrom: Shift;
  shiftTo?: Shift;
  message?: string;
  status: ExchangeStatus;
  targetResponse?: 'accepted' | 'rejected';
  adminComment?: string;
  resolvedBy?: User;
  resolvedAt?: string;
  createdAt: string;
}

// ── Leave Requests ────────────────────────────────────────────────────────────
export type LeaveType = 'vacation' | 'sick' | 'personal' | 'unpaid' | 'other';
export type LeaveStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequest {
  _id: string;
  user: User;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
  status: LeaveStatus;
  adminComment?: string;
  resolvedBy?: User;
  resolvedAt?: string;
  createdAt: string;
}

// ── Notifications ─────────────────────────────────────────────────────────────
export type NotificationType =
  | 'shift_assigned' | 'shift_updated' | 'shift_cancelled'
  | 'exchange_requested' | 'exchange_accepted' | 'exchange_rejected' | 'exchange_approved'
  | 'leave_approved' | 'leave_rejected'
  | 'session_approved' | 'session_rejected'
  | 'availability_approved' | 'availability_rejected'
  | 'general';

export interface Notification {
  _id: string;
  recipient: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export interface AnalyticsSummary {
  totalEmployees: number;
  activeSessionsCount: number;
  pendingApprovalsCount: number;
  monthlyHours: number;
  weeklyHours: number;
  dailyHours: number;
  overtimeHours: number;
}

export interface HoursOverTime {
  period: Record<string, number>;
  totalHours: number;
  overtimeHours: number;
  sessionCount: number;
}

export interface UserHours {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  totalHours: number;
  overtimeHours: number;
  sessionCount: number;
}

// ── API Responses ─────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}