export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PREPARING'
  | 'READY'
  | 'COLLECTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED';

export interface OrderItem {
  id: string;
  menuItemId: string;
  nameEn: string;
  nameAr: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  notes?: string | null;
  inventoryDeducted: boolean;
}

export interface Order {
  id: string;
  number: string;
  userId: string;
  status: OrderStatus;
  type: 'IMMEDIATE' | 'SCHEDULED';
  scheduledFor?: string | null;
  notes?: string | null;
  subtotal: number;
  discount: number;
  total: number;
  usedFreeDrink?: boolean;
  rejectReason?: string | null;
  qrCode?: string | null;
  createdAt: string;
  updatedAt?: string;
  acceptedAt?: string | null;
  preparingAt?: string | null;
  readyAt?: string | null;
  collectedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  items: OrderItem[];
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  rating?: { score: number; comment?: string | null } | null;
}

export interface OrderQueueResponse {
  data: Order[];
  meta: {
    counts: {
      pending: number;
      accepted: number;
      preparing: number;
      ready: number;
    };
    averagePrepMinutes: number | null;
  };
}

export interface CartLine {
  menuItemId: string;
  nameEn: string;
  nameAr: string;
  price: number;
  quantity: number;
  notes?: string;
}
