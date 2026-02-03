import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import StatusBadge from '@/components/dashboard/StatusBadge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, Eye, MessageSquare, Download } from 'lucide-react';
import { Invoice, PRODUCT_TYPE_LABELS } from '@/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ClientInvoices() {
  const { user } = useAuth();
  const { clients, getInvoicesByClient, updateInvoice } = useData();
  
  const client = clients.find(c => c.companyName === user?.companyName);
  const clientId = client?.id || 'client-1';
  
  const invoices = getInvoicesByClient(clientId);

  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [requestingChange, setRequestingChange] = useState<Invoice | null>(null);
  const [changeRequest, setChangeRequest] = useState('');

  const handleSubmitChangeRequest = () => {
    if (!requestingChange || !changeRequest.trim()) return;

    updateInvoice(requestingChange.id, {
      changeRequests: changeRequest,
      notes: `Change requested: ${changeRequest}`,
    });

    toast.success('Change request submitted successfully');
    setRequestingChange(null);
    setChangeRequest('');
  };

  const handleDownload = (invoice: Invoice) => {
    const clientData = clients.find(c => c.id === invoice.clientId);
    const content = `
INVOICE
=======

Invoice Number: ${invoice.invoiceNumber}
Date: ${format(new Date(invoice.createdAt), 'MMMM d, yyyy')}
Due Date: ${format(new Date(invoice.dueDate), 'MMMM d, yyyy')}
Status: ${invoice.status.toUpperCase()}

BILL TO
-------
Company: ${clientData?.companyName || 'N/A'}
Email: ${clientData?.email || 'N/A'}
Address: ${clientData?.address || 'N/A'}

ITEMS
-----
${invoice.products.map(p => 
  `${PRODUCT_TYPE_LABELS[p.type]} (${p.quantity}x)    $${p.totalPrice.toLocaleString()}`
).join('\n')}

---------------------------------
Subtotal:    $${invoice.subtotal.toLocaleString()}
Tax (10%):   $${invoice.tax.toLocaleString()}
---------------------------------
TOTAL:       $${invoice.total.toLocaleString()}

${invoice.notes ? `\nNotes: ${invoice.notes}` : ''}

---
Generated on ${format(new Date(), 'MMMM d, yyyy')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Invoice downloaded');
  };

  return (
    <DashboardLayout role="client">
      <PageHeader 
        title="Invoices"
        description="View and manage your invoices"
      />

      {/* View Invoice Dialog */}
      <Dialog open={!!viewingInvoice} onOpenChange={() => setViewingInvoice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice {viewingInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {viewingInvoice && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <StatusBadge status={viewingInvoice.status} />
                <p className="text-sm text-muted-foreground">
                  Due: {format(new Date(viewingInvoice.dueDate), 'MMM d, yyyy')}
                </p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Items</h4>
                <div className="space-y-2">
                  {viewingInvoice.products.map(product => (
                    <div key={product.id} className="flex justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">{PRODUCT_TYPE_LABELS[product.type]} ({product.quantity}x)</span>
                      <span className="font-medium text-sm">${product.totalPrice.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${viewingInvoice.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (10%)</span>
                  <span>${viewingInvoice.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>${viewingInvoice.total.toLocaleString()}</span>
                </div>
              </div>

              {viewingInvoice.notes && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{viewingInvoice.notes}</p>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setRequestingChange(viewingInvoice);
                  setViewingInvoice(null);
                }}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Request Changes
                </Button>
                <Button onClick={() => handleDownload(viewingInvoice)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Request Dialog */}
      <Dialog open={!!requestingChange} onOpenChange={() => setRequestingChange(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Invoice Changes</DialogTitle>
            <DialogDescription>
              Describe the changes you'd like to make to invoice {requestingChange?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Change Details</Label>
              <Textarea
                value={changeRequest}
                onChange={(e) => setChangeRequest(e.target.value)}
                placeholder="Please describe the changes you need..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestingChange(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitChangeRequest} disabled={!changeRequest.trim()}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
            <p className="text-muted-foreground text-sm">
              Invoices will appear here once they are generated
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Invoice #</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Due Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(invoice => (
                    <tr key={invoice.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-sm">{invoice.invoiceNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                        </p>
                      </td>
                      <td className="py-3 px-4 font-medium text-sm">${invoice.total.toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm">{format(new Date(invoice.dueDate), 'MMM d, yyyy')}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingInvoice(invoice)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(invoice)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
