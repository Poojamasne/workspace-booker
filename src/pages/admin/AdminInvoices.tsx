import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import StatusBadge from '@/components/dashboard/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Receipt, Eye, Send, Check, Download, Mail, Edit } from 'lucide-react';
import { Invoice, InvoiceStatus, PRODUCT_TYPE_LABELS, Product } from '@/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminInvoices() {
  const { invoices, clients, products, addInvoice, updateInvoice, sendInvoice, markInvoicePaid } = useData();

  const [isOpen, setIsOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    clientId: '',
    dueDate: '',
    notes: '',
    tax: 10,
  });

  const filteredInvoices = invoices.filter(invoice => {
    const client = clients.find(c => c.id === invoice.clientId);
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client?.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const clientProducts = formData.clientId 
    ? products.filter(p => p.clientId === formData.clientId)
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    const selected = products.filter(p => selectedProducts.includes(p.id));
    const subtotal = selected.reduce((sum, p) => sum + p.totalPrice, 0);
    const tax = subtotal * (formData.tax / 100);
    const total = subtotal + tax;

    if (editingInvoice) {
      updateInvoice(editingInvoice.id, {
        clientId: formData.clientId,
        products: selected,
        subtotal,
        tax,
        total,
        dueDate: formData.dueDate,
        notes: formData.notes,
      });
      toast.success('Invoice updated successfully');
    } else {
      addInvoice({
        clientId: formData.clientId,
        products: selected,
        subtotal,
        tax,
        total,
        dueDate: formData.dueDate,
        notes: formData.notes,
        status: 'draft',
      });
      toast.success('Invoice created successfully');
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      dueDate: '',
      notes: '',
      tax: 10,
    });
    setSelectedProducts([]);
    setEditingInvoice(null);
    setIsOpen(false);
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    setFormData({
      clientId: invoice.clientId,
      dueDate: invoice.dueDate,
      notes: invoice.notes || '',
      tax: (invoice.tax / invoice.subtotal) * 100,
    });
    setSelectedProducts(invoice.products.map(p => p.id));
    setIsOpen(true);
  };

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSendInvoice = (invoice: Invoice) => {
    sendInvoice(invoice.id);
    const client = clients.find(c => c.id === invoice.clientId);
    toast.success(`Invoice sent to ${client?.email}`);
  };

  const handleMarkPaid = (id: string) => {
    markInvoicePaid(id);
    toast.success('Invoice marked as paid');
  };

  const handleDownload = (invoice: Invoice) => {
    const client = clients.find(c => c.id === invoice.clientId);
    const content = `
INVOICE
=======

Invoice Number: ${invoice.invoiceNumber}
Date: ${format(new Date(invoice.createdAt), 'MMMM d, yyyy')}
Due Date: ${format(new Date(invoice.dueDate), 'MMMM d, yyyy')}
Status: ${invoice.status.toUpperCase()}

BILL TO
-------
Company: ${client?.companyName || 'N/A'}
Email: ${client?.email || 'N/A'}
Address: ${client?.address || 'N/A'}

ITEMS
-----
${invoice.products.map(p => 
  `${PRODUCT_TYPE_LABELS[p.type]} (${p.quantity}x)    $${p.totalPrice.toLocaleString()}`
).join('\n')}

---------------------------------
Subtotal:    $${invoice.subtotal.toLocaleString()}
Tax:         $${invoice.tax.toLocaleString()}
---------------------------------
TOTAL:       $${invoice.total.toLocaleString()}

${invoice.notes ? `\nNotes: ${invoice.notes}` : ''}
${invoice.changeRequests ? `\nChange Requests: ${invoice.changeRequests}` : ''}

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

  const selectedSubtotal = products
    .filter(p => selectedProducts.includes(p.id))
    .reduce((sum, p) => sum + p.totalPrice, 0);
  const selectedTax = selectedSubtotal * (formData.tax / 100);
  const selectedTotal = selectedSubtotal + selectedTax;

  return (
    <DashboardLayout role="admin">
      <PageHeader 
        title="Invoice Management"
        description="Create and manage client invoices"
        actions={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingInvoice ? 'Edit Invoice' : 'Create New Invoice'}
                </DialogTitle>
                <DialogDescription>
                  Select products and configure invoice details
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) => {
                      setFormData(prev => ({ ...prev, clientId: value }));
                      setSelectedProducts([]);
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.clientId && (
                  <div className="space-y-3">
                    <Label>Select Products</Label>
                    {clientProducts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No products available for this client
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {clientProducts.map(product => (
                          <div
                            key={product.id}
                            className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50"
                          >
                            <Checkbox
                              id={product.id}
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={() => handleProductToggle(product.id)}
                            />
                            <label htmlFor={product.id} className="flex-1 cursor-pointer">
                              <p className="font-medium text-sm">{PRODUCT_TYPE_LABELS[product.type]}</p>
                              <p className="text-xs text-muted-foreground">
                                {product.quantity} units · ${product.totalPrice.toLocaleString()}
                              </p>
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Rate (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.tax}
                      onChange={(e) => setFormData(prev => ({ ...prev, tax: parseFloat(e.target.value) || 0 }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes for the invoice..."
                    rows={2}
                  />
                </div>

                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${selectedSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax ({formData.tax}%)</span>
                    <span>${selectedTax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span>${selectedTotal.toLocaleString()}</span>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={selectedProducts.length === 0}>
                    {editingInvoice ? 'Update Invoice' : 'Create Invoice'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
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
                <div>
                  <p className="font-medium">
                    {clients.find(c => c.id === viewingInvoice.clientId)?.companyName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Due: {format(new Date(viewingInvoice.dueDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <StatusBadge status={viewingInvoice.status} />
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
                  <span className="text-muted-foreground">Tax</span>
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

              {viewingInvoice.changeRequests && (
                <div className="p-4 bg-warning/10 rounded-lg">
                  <p className="text-sm font-medium text-warning">Change Requests</p>
                  <p className="text-sm">{viewingInvoice.changeRequests}</p>
                </div>
              )}

              <DialogFooter className="flex-wrap gap-2">
                <Button variant="outline" onClick={() => handleDownload(viewingInvoice)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                {viewingInvoice.status === 'draft' && (
                  <>
                    <Button variant="outline" onClick={() => {
                      handleEdit(viewingInvoice);
                      setViewingInvoice(null);
                    }}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button onClick={() => {
                      handleSendInvoice(viewingInvoice);
                      setViewingInvoice(null);
                    }}>
                      <Send className="w-4 h-4 mr-2" />
                      Send Invoice
                    </Button>
                  </>
                )}
                {(viewingInvoice.status === 'sent' || viewingInvoice.status === 'pending') && (
                  <Button onClick={() => {
                    handleMarkPaid(viewingInvoice.id);
                    setViewingInvoice(null);
                  }} className="bg-success hover:bg-success/90">
                    <Check className="w-4 h-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Search invoices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No invoices found</h3>
            <p className="text-muted-foreground text-sm mb-4">
              {searchQuery || filterStatus !== 'all' ? 'Try different filters' : 'Create your first invoice'}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <Button onClick={() => setIsOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Invoices ({filteredInvoices.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Invoice #</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Due Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map(invoice => {
                    const client = clients.find(c => c.id === invoice.clientId);
                    return (
                      <tr key={invoice.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-sm">{invoice.invoiceNumber}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-sm">{client?.companyName || 'Unknown'}</td>
                        <td className="py-3 px-4 font-medium text-sm">${invoice.total.toLocaleString()}</td>
                        <td className="py-3 px-4 text-sm">{format(new Date(invoice.dueDate), 'MMM d, yyyy')}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={invoice.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setViewingInvoice(invoice)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDownload(invoice)}>
                              <Download className="w-4 h-4" />
                            </Button>
                            {invoice.status === 'draft' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleSendInvoice(invoice)}
                                title="Send Invoice"
                              >
                                <Mail className="w-4 h-4" />
                              </Button>
                            )}
                            {(invoice.status === 'sent' || invoice.status === 'pending') && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleMarkPaid(invoice.id)}
                                className="text-success"
                                title="Mark as Paid"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
