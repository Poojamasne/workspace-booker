// Core types for the Client Management & Workspace Booking System

export type UserRole = 'client' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyName?: string;
  createdAt: string;
}

export type ProductType = 
  | 'private_cabin'
  | 'work_desk'
  | 'floating_seat'
  | 'conference_room'
  | 'meeting_room'
  | 'others';

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  private_cabin: 'Private Cabin',
  work_desk: 'Work Desk',
  floating_seat: 'Floating Seat',
  conference_room: 'Conference Room',
  meeting_room: 'Meeting Room',
  others: 'Others',
};

export interface Product {
  id: string;
  type: ProductType;
  customType?: string;
  quantity: number;
  startDate: string;
  endDate: string;
  pricePerUnit: number;
  totalPrice: number;
  comments?: string;
  clientId: string;
  createdAt: string;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
}

export interface Client {
  id: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  contactPerson: string;
  createdAt: string;
  updatedAt: string;
}

export type AgreementStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface Agreement {
  id: string;
  clientId: string;
  products: Product[];
  startDate: string;
  endDate: string;
  termsAndConditions: string;
  status: AgreementStatus;
  totalValue: number;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'pending' | 'overdue';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  agreementId?: string;
  products: Product[];
  subtotal: number;
  tax: number;
  total: number;
  dueDate: string;
  status: InvoiceStatus;
  notes?: string;
  changeRequests?: string;
  sentAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalProducts: number;
  activeAgreements: number;
  pendingInvoices: number;
  totalClients: number;
  paidInvoices: number;
  totalRevenue: number;
}