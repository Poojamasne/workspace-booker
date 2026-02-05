import { User, Client, Product, Agreement, Invoice } from '@/types';

// Demo Users
export const demoUsers: User[] = [
  {
    id: 'user-1',
    email: 'client@zonixtec.com',
    name: 'Aniket Sangale',
    role: 'client',
    companyName: 'Zonixtec',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'user-2',
    email: 'admin@workspace.com',
    name: 'Sarah Admin',
    role: 'admin',
    createdAt: '2024-01-01T09:00:00Z',
  },
];

// Demo Clients
export const demoClients: Client[] = [
  {
    id: 'client-1',
    companyName: 'Zonixtec',
    email: 'contact@zonixtec.com',
    phone: '+1 (555) 123-4567',
    address: '123 Tech Park, Suite 400, San Francisco, CA 94105',
    contactPerson: 'Aniket Sangale',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'client-2',
    companyName: 'InnovateTech Solutions',
    email: 'hello@innovatetech.io',
    phone: '+1 (555) 987-6543',
    address: '456 Innovation Blvd, Floor 12, New York, NY 10001',
    contactPerson: 'Emily Johnson',
    createdAt: '2024-02-01T14:30:00Z',
    updatedAt: '2024-02-01T14:30:00Z',
  },
  {
    id: 'client-3',
    companyName: 'StartupHub Inc',
    email: 'info@startuphub.co',
    phone: '+1 (555) 456-7890',
    address: '789 Startup Lane, Austin, TX 78701',
    contactPerson: 'Michael Chen',
    createdAt: '2024-02-10T09:15:00Z',
    updatedAt: '2024-02-10T09:15:00Z',
  },
];

// Demo Products
export const demoProducts: Product[] = [
  {
    id: 'prod-1',
    type: 'private_cabin',
    quantity: 2,
    startDate: '2024-03-01',
    endDate: '2024-08-31',
    pricePerUnit: 1500,
    totalPrice: 3000,
    comments: 'Need window-side cabins with AC',
    clientId: 'client-1',
    createdAt: '2024-02-20T10:00:00Z',
    status: 'active',
  },
  {
    id: 'prod-2',
    type: 'work_desk',
    quantity: 5,
    startDate: '2024-03-01',
    endDate: '2024-12-31',
    pricePerUnit: 350,
    totalPrice: 1750,
    comments: 'Preferably near the cafeteria',
    clientId: 'client-1',
    createdAt: '2024-02-20T10:30:00Z',
    status: 'active',
  },
  {
    id: 'prod-3',
    type: 'conference_room',
    quantity: 1,
    startDate: '2024-03-15',
    endDate: '2024-03-15',
    pricePerUnit: 200,
    totalPrice: 200,
    comments: 'Full day booking for team meeting',
    clientId: 'client-2',
    createdAt: '2024-03-01T08:00:00Z',
    status: 'completed',
  },
  {
    id: 'prod-4',
    type: 'floating_seat',
    quantity: 10,
    startDate: '2024-04-01',
    endDate: '2024-06-30',
    pricePerUnit: 200,
    totalPrice: 2000,
    clientId: 'client-3',
    createdAt: '2024-03-10T11:00:00Z',
    status: 'pending',
  },
];

// Demo Agreements
export const demoAgreements: Agreement[] = [
  {
    id: 'agr-1',
    clientId: 'client-1',
    products: [demoProducts[0], demoProducts[1]],
    startDate: '2024-03-01',
    endDate: '2024-12-31',
    termsAndConditions: `WORKSPACE AGREEMENT TERMS AND CONDITIONS

1. BOOKING CONFIRMATION: All bookings are subject to availability and confirmed upon payment.

2. PAYMENT TERMS: Payment is due within 15 days of invoice date. Late payments may incur a 2% monthly fee.

3. CANCELLATION POLICY: Cancellations made 30+ days in advance receive full refund. Cancellations within 30 days forfeit 50% of booking value.

4. USAGE RULES: Clients must adhere to workspace policies including noise levels, cleanliness, and professional conduct.

5. LIABILITY: The workspace provider is not liable for personal belongings. Insurance is recommended.

6. MODIFICATIONS: Any changes to this agreement must be in writing and signed by both parties.`,
    status: 'approved',
    totalValue: 4750,
    createdAt: '2024-02-21T09:00:00Z',
    updatedAt: '2024-02-22T14:00:00Z',
  },
  {
    id: 'agr-2',
    clientId: 'client-3',
    products: [demoProducts[3]],
    startDate: '2024-04-01',
    endDate: '2024-06-30',
    termsAndConditions: `WORKSPACE AGREEMENT TERMS AND CONDITIONS

1. BOOKING CONFIRMATION: All bookings are subject to availability and confirmed upon payment.

2. PAYMENT TERMS: Payment is due within 15 days of invoice date.

3. CANCELLATION POLICY: Standard cancellation terms apply.

4. USAGE RULES: Standard workspace policies apply.`,
    status: 'pending',
    totalValue: 2000,
    createdAt: '2024-03-11T10:00:00Z',
    updatedAt: '2024-03-11T10:00:00Z',
  },
];

// Demo Invoices
export const demoInvoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2024-001',
    clientId: 'client-1',
    agreementId: 'agr-1',
    products: [demoProducts[0], demoProducts[1]],
    subtotal: 4750,
    tax: 475,
    total: 5225,
    dueDate: '2024-03-15',
    status: 'paid',
    sentAt: '2024-02-25T10:00:00Z',
    paidAt: '2024-03-10T15:30:00Z',
    createdAt: '2024-02-25T10:00:00Z',
    updatedAt: '2024-03-10T15:30:00Z',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2024-002',
    clientId: 'client-2',
    products: [demoProducts[2]],
    subtotal: 200,
    tax: 20,
    total: 220,
    dueDate: '2024-03-30',
    status: 'sent',
    sentAt: '2024-03-16T09:00:00Z',
    createdAt: '2024-03-16T09:00:00Z',
    updatedAt: '2024-03-16T09:00:00Z',
  },
  {
    id: 'inv-3',
    invoiceNumber: 'INV-2024-003',
    clientId: 'client-3',
    agreementId: 'agr-2',
    products: [demoProducts[3]],
    subtotal: 2000,
    tax: 200,
    total: 2200,
    dueDate: '2024-04-15',
    status: 'pending',
    notes: 'Awaiting agreement approval',
    createdAt: '2024-03-12T11:00:00Z',
    updatedAt: '2024-03-12T11:00:00Z',
  },
];

// Initialize localStorage with demo data
export function initializeDemoData() {
  if (!localStorage.getItem('workspace_users')) {
    localStorage.setItem('workspace_users', JSON.stringify(demoUsers));
  }
  if (!localStorage.getItem('workspace_clients')) {
    localStorage.setItem('workspace_clients', JSON.stringify(demoClients));
  }
  if (!localStorage.getItem('workspace_products')) {
    localStorage.setItem('workspace_products', JSON.stringify(demoProducts));
  }
  if (!localStorage.getItem('workspace_agreements')) {
    localStorage.setItem('workspace_agreements', JSON.stringify(demoAgreements));
  }
  if (!localStorage.getItem('workspace_invoices')) {
    localStorage.setItem('workspace_invoices', JSON.stringify(demoInvoices));
  }
}
