import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Client, Product, Agreement, Invoice, DashboardStats } from '@/types';
import { useAuth } from './AuthContext';

interface DataContextType {
  // Clients
  clients: Client[];
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => Client;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClient: (id: string) => Client | undefined;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Product;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProductsByClient: (clientId: string) => Product[];

  // Agreements
  agreements: Agreement[];
  addAgreement: (agreement: Omit<Agreement, 'id' | 'createdAt' | 'updatedAt'>) => Agreement;
  updateAgreement: (id: string, data: Partial<Agreement>) => void;
  deleteAgreement: (id: string) => void;
  getAgreementsByClient: (clientId: string) => Agreement[];

  // Invoices
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'invoiceNumber'>) => Invoice;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  getInvoicesByClient: (clientId: string) => Invoice[];
  sendInvoice: (id: string) => void;
  markInvoicePaid: (id: string) => void;

  // Stats
  getStats: () => DashboardStats;
  getClientStats: (clientId: string) => DashboardStats;

  // Refresh data
  refreshData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateInvoiceNumber(): string {
  const year = new Date().getFullYear();
  const invoices = JSON.parse(localStorage.getItem('workspace_invoices') || '[]');
  const count = invoices.length + 1;
  return `INV-${year}-${count.toString().padStart(3, '0')}`;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const loadData = useCallback(() => {
    setClients(JSON.parse(localStorage.getItem('workspace_clients') || '[]'));
    setProducts(JSON.parse(localStorage.getItem('workspace_products') || '[]'));
    setAgreements(JSON.parse(localStorage.getItem('workspace_agreements') || '[]'));
    setInvoices(JSON.parse(localStorage.getItem('workspace_invoices') || '[]'));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refreshData = () => loadData();

  // Client operations
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: generateId('client'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...clients, newClient];
    setClients(updated);
    localStorage.setItem('workspace_clients', JSON.stringify(updated));
    return newClient;
  };

  const updateClient = (id: string, data: Partial<Client>) => {
    const updated = clients.map(c => 
      c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
    );
    setClients(updated);
    localStorage.setItem('workspace_clients', JSON.stringify(updated));
  };

  const deleteClient = (id: string) => {
    const updated = clients.filter(c => c.id !== id);
    setClients(updated);
    localStorage.setItem('workspace_clients', JSON.stringify(updated));
  };

  const getClient = (id: string) => clients.find(c => c.id === id);

  // Product operations
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt'>): Product => {
    const newProduct: Product = {
      ...productData,
      id: generateId('prod'),
      createdAt: new Date().toISOString(),
    };
    const updated = [...products, newProduct];
    setProducts(updated);
    localStorage.setItem('workspace_products', JSON.stringify(updated));
    return newProduct;
  };

  const updateProduct = (id: string, data: Partial<Product>) => {
    const updated = products.map(p => p.id === id ? { ...p, ...data } : p);
    setProducts(updated);
    localStorage.setItem('workspace_products', JSON.stringify(updated));
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    localStorage.setItem('workspace_products', JSON.stringify(updated));
  };

  const getProductsByClient = (clientId: string) => products.filter(p => p.clientId === clientId);

  // Agreement operations
  const addAgreement = (agreementData: Omit<Agreement, 'id' | 'createdAt' | 'updatedAt'>): Agreement => {
    const newAgreement: Agreement = {
      ...agreementData,
      id: generateId('agr'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...agreements, newAgreement];
    setAgreements(updated);
    localStorage.setItem('workspace_agreements', JSON.stringify(updated));
    return newAgreement;
  };

  const updateAgreement = (id: string, data: Partial<Agreement>) => {
    const updated = agreements.map(a => 
      a.id === id ? { ...a, ...data, updatedAt: new Date().toISOString() } : a
    );
    setAgreements(updated);
    localStorage.setItem('workspace_agreements', JSON.stringify(updated));
  };

  const deleteAgreement = (id: string) => {
    const updated = agreements.filter(a => a.id !== id);
    setAgreements(updated);
    localStorage.setItem('workspace_agreements', JSON.stringify(updated));
  };

  const getAgreementsByClient = (clientId: string) => agreements.filter(a => a.clientId === clientId);

  // Invoice operations
  const addInvoice = (invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'invoiceNumber'>): Invoice => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: generateId('inv'),
      invoiceNumber: generateInvoiceNumber(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [...invoices, newInvoice];
    setInvoices(updated);
    localStorage.setItem('workspace_invoices', JSON.stringify(updated));
    return newInvoice;
  };

  const updateInvoice = (id: string, data: Partial<Invoice>) => {
    const updated = invoices.map(i => 
      i.id === id ? { ...i, ...data, updatedAt: new Date().toISOString() } : i
    );
    setInvoices(updated);
    localStorage.setItem('workspace_invoices', JSON.stringify(updated));
  };

  const deleteInvoice = (id: string) => {
    const updated = invoices.filter(i => i.id !== id);
    setInvoices(updated);
    localStorage.setItem('workspace_invoices', JSON.stringify(updated));
  };

  const getInvoicesByClient = (clientId: string) => invoices.filter(i => i.clientId === clientId);

  const sendInvoice = (id: string) => {
    updateInvoice(id, { 
      status: 'sent', 
      sentAt: new Date().toISOString() 
    });
  };

  const markInvoicePaid = (id: string) => {
    updateInvoice(id, { 
      status: 'paid', 
      paidAt: new Date().toISOString() 
    });
  };

  // Stats
  const getStats = (): DashboardStats => {
    const activeAgreements = agreements.filter(a => a.status === 'approved').length;
    const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'sent').length;
    const paidInvoices = invoices.filter(i => i.status === 'paid').length;
    const totalRevenue = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.total, 0);

    return {
      totalProducts: products.length,
      activeAgreements,
      pendingInvoices,
      totalClients: clients.length,
      paidInvoices,
      totalRevenue,
    };
  };

  const getClientStats = (clientId: string): DashboardStats => {
    const clientProducts = products.filter(p => p.clientId === clientId);
    const clientAgreements = agreements.filter(a => a.clientId === clientId);
    const clientInvoices = invoices.filter(i => i.clientId === clientId);

    return {
      totalProducts: clientProducts.length,
      activeAgreements: clientAgreements.filter(a => a.status === 'approved').length,
      pendingInvoices: clientInvoices.filter(i => i.status === 'pending' || i.status === 'sent').length,
      totalClients: 0,
      paidInvoices: clientInvoices.filter(i => i.status === 'paid').length,
      totalRevenue: clientInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
    };
  };

  return (
    <DataContext.Provider
      value={{
        clients,
        addClient,
        updateClient,
        deleteClient,
        getClient,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductsByClient,
        agreements,
        addAgreement,
        updateAgreement,
        deleteAgreement,
        getAgreementsByClient,
        invoices,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        getInvoicesByClient,
        sendInvoice,
        markInvoicePaid,
        getStats,
        getClientStats,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
