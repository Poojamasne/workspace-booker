import React from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import StatCard from '@/components/dashboard/StatCard';
import StatusBadge from '@/components/dashboard/StatusBadge';
import { Users, Package, FileText, Receipt, TrendingUp, Clock, IndianRupee } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { getStats, clients, agreements, invoices, products } = useData();

  const stats = getStats();

  // Recent clients
  const recentClients = [...clients]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Pending agreements
  const pendingAgreements = agreements.filter(a => a.status === 'pending');

  // Recent invoices
  const recentInvoices = [...invoices]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <DashboardLayout role="admin">
      <PageHeader 
        title={`Welcome, ${user?.name || 'Admin'}`}
        description="Overview of your workspace management system"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          icon={<Users className="w-6 h-6" />}
          description="Registered companies"
        />
        <StatCard
          title="Active Agreements"
          value={stats.activeAgreements}
          icon={<FileText className="w-6 h-6" />}
          description="Approved contracts"
        />
        <StatCard
          title="Pending Invoices"
          value={stats.pendingInvoices}
          icon={<IndianRupee className="w-6 h-6" />}
          description="Awaiting payment"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
          icon={<IndianRupee className="w-6 h-6" />}
          description={`${stats.paidInvoices} paid invoices`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Clients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              Recent Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentClients.map(client => (
                <div key={client.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-accent">
                      {client.companyName.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{client.companyName}</p>
                    <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Agreements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              Pending Agreements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingAgreements.length === 0 ? (
              <p className="text-muted-foreground text-sm">No pending agreements</p>
            ) : (
              <div className="space-y-3">
                {pendingAgreements.slice(0, 4).map(agreement => {
                  const client = clients.find(c => c.id === agreement.clientId);
                  return (
                    <div key={agreement.id} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{client?.companyName || 'Unknown'}</p>
                        <StatusBadge status={agreement.status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ₹{agreement.totalValue.toLocaleString('en-IN')} · {format(new Date(agreement.createdAt), 'MMM d')}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5 text-accent" />
              Recent Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentInvoices.map(invoice => {
                const client = clients.find(c => c.id === invoice.clientId);
                return (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{client?.companyName || 'Unknown'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">₹{invoice.total.toLocaleString('en-IN')}</p>
                      <StatusBadge status={invoice.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-accent" />
              Products Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{products.filter(p => p.status === 'active').length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{products.filter(p => p.status === 'pending').length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{products.filter(p => p.status === 'completed').length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold text-foreground">{stats.totalProducts}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
  
}