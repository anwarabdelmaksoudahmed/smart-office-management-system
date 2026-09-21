import { api } from '@/shared/services/api';
import type { Paginated } from '@/modules/menu/types/catalog';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  locale: string;
  status: string;
  lastLoginAt?: string | null;
  createdAt: string;
  roles: Array<{
    role: { id: string; code: string; nameEn: string; nameAr: string };
  }>;
}

export interface Role {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  description?: string | null;
  isSystem: boolean;
  permissions: Array<{
    permission: { id: string; code: string; module: string };
  }>;
  _count?: { users: number };
}

export interface Permission {
  id: string;
  code: string;
  module: string;
  nameEn: string;
  nameAr: string;
}

export interface AppSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  group: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId?: string | null;
  createdAt: string;
  metadata?: unknown;
  actor?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface AdminDashboard {
  portal: string;
  kpis: {
    activeUsers: number;
    ordersToday: number;
    revenueToday: number;
    pendingOrders: number;
    lowStockAlerts: number;
    activeGamingSessions: number;
    bookingsToday: number;
  };
  recentAudit: AuditLog[];
}

export const adminApi = {
  dashboard() {
    return api.get<AdminDashboard>('/dashboard/admin');
  },
  users: {
    list(params?: { page?: number; limit?: number; search?: string; status?: string }) {
      return api.get<Paginated<AdminUser>>('/users', { params });
    },
    create(payload: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
      locale?: string;
      roleIds?: string[];
    }) {
      return api.post<AdminUser>('/users', payload);
    },
    update(
      id: string,
      payload: Partial<{
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone: string;
        locale: string;
        status: string;
        roleIds: string[];
      }>,
    ) {
      return api.patch<AdminUser>(`/users/${id}`, payload);
    },
    remove(id: string) {
      return api.delete(`/users/${id}`);
    },
  },
  roles: {
    list() {
      return api.get<Role[]>('/roles');
    },
    assignPermissions(id: string, permissionIds: string[]) {
      return api.put<Role>(`/roles/${id}/permissions`, { permissionIds });
    },
  },
  permissions: {
    list() {
      return api.get<Permission[]>('/permissions');
    },
  },
  reports: {
    get(type: string, days = 7) {
      return api.get(`/reports/${type}`, { params: { days } });
    },
  },
  settings: {
    list(group?: string) {
      return api.get<AppSetting[]>('/settings', { params: group ? { group } : undefined });
    },
    update(settings: Array<{ key: string; value: Record<string, unknown>; group?: string }>) {
      return api.patch<AppSetting[]>('/settings', { settings });
    },
  },
  audit: {
    list(params?: { page?: number; limit?: number; search?: string; action?: string; resource?: string }) {
      return api.get<Paginated<AuditLog>>('/audit-logs', { params });
    },
  },
};
