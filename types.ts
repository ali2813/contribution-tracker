export interface Payment {
  id: string;
  date: string;
  amount: number;
  note?: string;
}

export enum PaymentFrequency {
  MONTHLY = 'Monthly',
  YEARLY = 'Yearly',
  ONE_TIME = 'One-time',
}

export interface Member {
  id: number;
  name: string;
  phone: string;
  email?: string;
  committedAmount: number; // The target amount per year
  frequency: PaymentFrequency;
  payments: Payment[];
  notes?: string;
}

export interface DashboardStats {
  totalCommitted: number;
  totalCollected: number;
  memberCount: number;
  collectionRate: number;
}