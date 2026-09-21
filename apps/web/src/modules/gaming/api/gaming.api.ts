import { api } from '@/shared/services/api';
import type { Paginated } from '@/modules/menu/types/catalog';

export interface GamingRoom {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  capacity: number;
  isActive: boolean;
  devices?: GamingDevice[];
  _count?: { bookings: number; waitingQueue: number };
}

export interface GamingDevice {
  id: string;
  roomId: string;
  code: string;
  name: string;
  type: string;
  isActive: boolean;
  room?: { id: string; code: string; nameEn: string; nameAr: string };
}

export interface GamingSession {
  id: string;
  bookingId: string;
  startedAt: string;
  endsAt: string;
  extendedMin: number;
  endedAt?: string | null;
}

export interface GamingBooking {
  id: string;
  number: string;
  userId: string;
  roomId: string;
  status: string;
  startAt: string;
  endAt: string;
  partySize: number;
  notes?: string | null;
  qrCode?: string | null;
  room?: GamingRoom;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  session?: GamingSession | null;
}

export interface QueueEntry {
  id: string;
  roomId: string;
  userId: string;
  status: string;
  position: number;
  partySize: number;
  notifiedAt?: string | null;
  room?: { id: string; code: string; nameEn: string; nameAr: string };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface AvailabilityResponse {
  room: GamingRoom;
  date: string;
  slotMinutes: number;
  slots: Array<{ startAt: string; endAt: string; available: boolean }>;
  bookings: Array<{
    id: string;
    number: string;
    startAt: string;
    endAt: string;
    status: string;
  }>;
}

export const roomsApi = {
  list(params?: { page?: number; limit?: number; search?: string; activeOnly?: boolean }) {
    return api.get<Paginated<GamingRoom>>('/gaming/rooms', { params });
  },
  create(payload: {
    code: string;
    nameEn: string;
    nameAr: string;
    capacity?: number;
    isActive?: boolean;
  }) {
    return api.post<GamingRoom>('/gaming/rooms', payload);
  },
  update(id: string, payload: Partial<GamingRoom>) {
    return api.patch<GamingRoom>(`/gaming/rooms/${id}`, payload);
  },
  remove(id: string) {
    return api.delete(`/gaming/rooms/${id}`);
  },
};

export const devicesApi = {
  list(params?: { page?: number; limit?: number; roomId?: string; activeOnly?: boolean }) {
    return api.get<Paginated<GamingDevice>>('/gaming/devices', { params });
  },
  create(payload: {
    roomId: string;
    code: string;
    name: string;
    type: string;
    isActive?: boolean;
  }) {
    return api.post<GamingDevice>('/gaming/devices', payload);
  },
  update(id: string, payload: Partial<GamingDevice>) {
    return api.patch<GamingDevice>(`/gaming/devices/${id}`, payload);
  },
  remove(id: string) {
    return api.delete(`/gaming/devices/${id}`);
  },
};

export const availabilityApi = {
  get(params: { roomId: string; date: string; slotMinutes?: number }) {
    return api.get<AvailabilityResponse>('/gaming/availability', { params });
  },
};

export const reservationsApi = {
  list(params?: {
    page?: number;
    limit?: number;
    status?: string;
    roomId?: string;
    search?: string;
  }) {
    return api.get<Paginated<GamingBooking>>('/reservations', { params });
  },
  active() {
    return api.get<GamingBooking[]>('/reservations/active');
  },
  create(payload: {
    roomId: string;
    startAt: string;
    endAt: string;
    partySize?: number;
    notes?: string;
  }) {
    return api.post<GamingBooking>('/reservations', payload);
  },
  cancel(id: string) {
    return api.post<GamingBooking>(`/reservations/${id}/cancel`);
  },
  start(id: string) {
    return api.post<GamingBooking>(`/reservations/${id}/start`);
  },
  extend(id: string, minutes: number) {
    return api.post<GamingBooking>(`/reservations/${id}/extend`, { minutes });
  },
  complete(id: string) {
    return api.post<GamingBooking>(`/reservations/${id}/complete`);
  },
};

export const queueApi = {
  list(roomId?: string) {
    return api.get<QueueEntry[]>('/gaming/queue', {
      params: roomId ? { roomId } : undefined,
    });
  },
  join(payload: { roomId: string; partySize?: number }) {
    return api.post<QueueEntry>('/gaming/queue', payload);
  },
  leave(id: string) {
    return api.delete(`/gaming/queue/${id}`);
  },
  notify(id: string) {
    return api.post<QueueEntry>(`/gaming/queue/${id}/notify`);
  },
  seat(id: string, durationMin?: number) {
    return api.post<{ entryId: string; booking: GamingBooking }>(
      `/gaming/queue/${id}/seat`,
      { durationMin },
    );
  },
};
