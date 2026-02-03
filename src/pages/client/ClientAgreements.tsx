import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import StatusBadge from '@/components/dashboard/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Plus, FileText, Eye, Download } from 'lucide-react';
import { Agreement, PRODUCT_TYPE_LABELS } from '@/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

const DEFAULT_TERMS = `WORKSPACE AGREEMENT TERMS AND CONDITIONS

1. BOOKING CONFIRMATION: All bookings are subject to availability and confirmed upon payment.

2. PAYMENT TERMS: Payment is due within 15 days of invoice date. Late payments may incur a 2% monthly fee.

3. CANCELLATION POLICY: Cancellations made 30+ days in advance receive full refund. Cancellations within 30 days forfeit 50% of booking value.

4. USAGE RULES: Clients must adhere to workspace policies including noise levels, cleanliness, and professional conduct.

5. LIABILITY: The workspace provider is not liable for personal belongings. Insurance is recommended.

6. MODIFICATIONS: Any changes to this agreement must be in writing and signed by both parties.`;

export default function ClientAgreements() {
  const { user } = useAuth();
  const { clients, getProductsByClient, getAgreementsByClient, addAgreement, products } = useData();
  
  const client = clients.find(c => c.companyName === user?.companyName);
  const clientId = client?.id || 'client-1';
  
  const clientProducts = getProductsByClient(clientId);
  const agreements = getAgreementsByClient(clientId);

  const [isOpen, setIsOpen] = useState(false);
  const [viewingAgreement, setViewingAgreement] = useState<Agreement | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    termsAndConditions: DEFAULT_TERMS,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedProducts.length === 0) {
      toast.error('Please select at least one product');
      return;
    }

    const selected = clientProducts.filter(p => selectedProducts.includes(p.id));
    const totalValue = selected.reduce((sum, p) => sum + p.totalPrice, 0);

    addAgreement({
      clientId,
      products: selected,
      startDate: formData.startDate,
      endDate: formData.endDate,
      termsAndConditions: formData.termsAndConditions,
      status: 'pending',
      totalValue,
    });

    toast.success('Agreement created successfully');
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      startDate: '',
      endDate: '',
      termsAndConditions: DEFAULT_TERMS,
    });
    setSelectedProducts([]);
    setIsOpen(false);
  };

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleDownload = (agreement: Agreement) => {
    const clientData = clients.find(c => c.id === agreement.clientId);
    const content = `
WORKSPACE AGREEMENT
==================

Agreement ID: ${agreement.id}
Date: ${format(new Date(agreement.createdAt), 'MMMM d, yyyy')}
Status: ${agreement.status.toUpperCase()}

CLIENT INFORMATION
------------------
Company: ${clientData?.companyName || 'N/A'}
Contact: ${clientData?.contactPerson || 'N/A'}
Email: ${clientData?.email || 'N/A'}
Address: ${clientData?.address || 'N/A'}

AGREEMENT PERIOD
----------------
Start Date: ${format(new Date(agreement.startDate), 'MMMM d, yyyy')}
End Date: ${format(new Date(agreement.endDate), 'MMMM d, yyyy')}

PRODUCTS
--------
${agreement.products.map(p => 
  `- ${PRODUCT_TYPE_LABELS[p.type]}: ${p.quantity} unit(s) @ $${p.pricePerUnit}/unit = $${p.totalPrice}`
).join('\n')}

Total Value: $${agreement.totalValue.toLocaleString()}

TERMS AND CONDITIONS
--------------------
${agreement.termsAndConditions}

---
This document was generated on ${format(new Date(), 'MMMM d, yyyy')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agreement-${agreement.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Agreement downloaded');
  };

  const selectedTotal = clientProducts
    .filter(p => selectedProducts.includes(p.id))
    .reduce((sum, p) => sum + p.totalPrice, 0);

  return (
    <DashboardLayout role="client">
      <PageHeader 
        title="Agreements"
        description="Manage your workspace agreements"
        actions={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                New Agreement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Agreement</DialogTitle>
                <DialogDescription>
                  Select products and configure your agreement
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Product Selection */}
                <div className="space-y-3">
                  <Label>Select Products</Label>
                  {clientProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No products available. Create product bookings first.
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Agreement Start Date</Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Agreement End Date</Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Terms & Conditions</Label>
                  <Textarea
                    value={formData.termsAndConditions}
                    onChange={(e) => setFormData(prev => ({ ...prev, termsAndConditions: e.target.value }))}
                    rows={8}
                    className="font-mono text-xs"
                  />
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Agreement Total Value</p>
                  <p className="text-2xl font-bold">${selectedTotal.toLocaleString()}</p>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={selectedProducts.length === 0}>
                    Create Agreement
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* View Agreement Dialog */}
      <Dialog open={!!viewingAgreement} onOpenChange={() => setViewingAgreement(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agreement Details</DialogTitle>
          </DialogHeader>
          {viewingAgreement && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <StatusBadge status={viewingAgreement.status} />
                <p className="text-sm text-muted-foreground">
                  Created {format(new Date(viewingAgreement.createdAt), 'MMM d, yyyy')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{format(new Date(viewingAgreement.startDate), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">{format(new Date(viewingAgreement.endDate), 'MMM d, yyyy')}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Products</h4>
                <div className="space-y-2">
                  {viewingAgreement.products.map(product => (
                    <div key={product.id} className="flex justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm">{PRODUCT_TYPE_LABELS[product.type]} ({product.quantity}x)</span>
                      <span className="font-medium text-sm">${product.totalPrice.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-accent/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-accent">${viewingAgreement.totalValue.toLocaleString()}</p>
              </div>

              <div>
                <h4 className="font-medium mb-2">Terms & Conditions</h4>
                <pre className="text-xs whitespace-pre-wrap p-4 bg-muted rounded-lg max-h-[200px] overflow-y-auto">
                  {viewingAgreement.termsAndConditions}
                </pre>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => handleDownload(viewingAgreement)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Agreements List */}
      {agreements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No agreements yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create your first agreement to formalize your bookings
            </p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Agreement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Agreements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Agreement</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Products</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Duration</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Value</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {agreements.map(agreement => (
                    <tr key={agreement.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-sm">{agreement.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(agreement.createdAt), 'MMM d, yyyy')}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-sm">{agreement.products.length} product(s)</td>
                      <td className="py-3 px-4 text-sm">
                        {format(new Date(agreement.startDate), 'MMM d')} - {format(new Date(agreement.endDate), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-4 font-medium text-sm">${agreement.totalValue.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={agreement.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingAgreement(agreement)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownload(agreement)}
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
