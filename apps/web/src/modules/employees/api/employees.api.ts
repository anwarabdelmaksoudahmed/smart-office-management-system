import { api } from '@/shared/services/api';

export interface RewardBalance {
  points: number;
  freeDrinks: number;
  config: {
    pointsPerOrder: number;
    pointsPerRating: number;
    pointsPerFreeDrink: number;
  };
  recent: {
    rewards: Array<{
      id: string;
      type: string;
      points: number;
      reference?: string | null;
      note?: string | null;
      createdAt: string;
    }>;
    freeDrinks: Array<{
      id: string;
      type: string;
      amount: number;
      note?: string | null;
      createdAt: string;
      order?: { id: string; number: string } | null;
    }>;
  };
}

export interface EmployeeMe {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  locale: string;
  employeeProfile?: {
    employeeCode: string;
    jobTitle?: string | null;
    department?: {
      id: string;
      code: string;
      nameEn: string;
      nameAr: string;
    } | null;
  } | null;
  balance: RewardBalance;
}

export const employeesApi = {
  me() {
    return api.get<EmployeeMe>('/employees/me');
  },
  balance() {
    return api.get<RewardBalance>('/employees/me/balance');
  },
  redeem(freeDrinks = 1) {
    return api.post<RewardBalance>('/employees/me/rewards/redeem', { freeDrinks });
  },
};
