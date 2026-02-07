import React from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import StatCard from '@/components/dashboard/StatCard';
import StatusBadge from '@/components/dashboard/StatusBadge';
import { Package, FileText, Receipt, Activity, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PRODUCT_TYPE_LABELS } from '@/types';
import { format } from 'date-fns';

export default function ClientDashboard() {
  const { user } = useAuth();
  const { getClientStats, getProductsByClient, getAgreementsByClient, getInvoicesByClient, clients } = useData();

  // Find the client associated with this user
  const client = clients.find(c => c.companyName === user?.companyName);
  const clientId = client?.id || 'client-1'; // Default to demo client for testing

  const stats = getClientStats(clientId);
  const products = getProductsByClient(clientId);
  const agreements = getAgreementsByClient(clientId);
  const invoices = getInvoicesByClient(clientId);

  // Recent activity - combine and sort by date
  const recentProducts = products.slice(-3).map(p => ({
    type: 'product' as const,
    title: `Booked ${PRODUCT_TYPE_LABELS[p.type]}`,
    date: p.createdAt,
    status: p.status,
  }));

  const recentInvoices = invoices.slice(-3).map(i => ({
    type: 'invoice' as const,
    title: `Invoice ${i.invoiceNumber}`,
    date: i.createdAt,
    status: i.status,
  }));

  const recentActivity = [...recentProducts, ...recentInvoices]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <DashboardLayout role="client">
      <PageHeader 
        title={`Welcome, ${user?.name || 'Client'}`}
        description={`${client?.companyName || 'Your'} workspace dashboard`}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={<Package className="w-6 h-6" />}
          description="Booked workspaces"
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
          icon={<Receipt className="w-6 h-6" />}
          description="Awaiting payment"
        />
        <StatCard
          title="Paid Invoices"
          value={stats.paidInvoices}
          icon={<CheckCircle className="w-6 h-6" />}
          description={`₹${stats.totalRevenue.toLocaleString('en-IN')} total`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Products */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-accent" />
              Active Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {products.filter(p => p.status === 'active').length === 0 ? (
              <p className="text-muted-foreground text-sm">No active bookings</p>
            ) : (
              <div className="space-y-3">
                {products.filter(p => p.status === 'active').slice(0, 4).map(product => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{PRODUCT_TYPE_LABELS[product.type]}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.quantity} {product.quantity === 1 ? 'unit' : 'units'} · ₹{product.totalPrice.toLocaleString('en-IN')}/mo
                      </p>
                    </div>
                    <StatusBadge status={product.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-accent" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                        {activity.type === 'product' ? (
                          <Package className="w-4 h-4 text-accent" />
                        ) : (
                          <Receipt className="w-4 h-4 text-accent" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(activity.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={activity.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invoices */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              Pending Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.filter(i => i.status === 'pending' || i.status === 'sent').length === 0 ? (
              <p className="text-muted-foreground text-sm">No pending invoices</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Invoice #</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Due Date</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.filter(i => i.status === 'pending' || i.status === 'sent').map(invoice => (
                      <tr key={invoice.id} className="border-b last:border-0">
                        <td className="py-3 px-4 font-medium text-sm">{invoice.invoiceNumber}</td>
                        <td className="py-3 px-4 text-sm">₹{invoice.total.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-4 text-sm">{format(new Date(invoice.dueDate), 'MMM d, yyyy')}</td>
                        <td className="py-3 px-4"><StatusBadge status={invoice.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}