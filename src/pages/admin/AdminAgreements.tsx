import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import StatusBadge from '@/components/dashboard/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Eye, Download, Check, X } from 'lucide-react';
import { Agreement, AgreementStatus, PRODUCT_TYPE_LABELS } from '@/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminAgreements() {
  const { agreements, clients, updateAgreement } = useData();

  const [viewingAgreement, setViewingAgreement] = useState<Agreement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredAgreements = agreements.filter(agreement => {
    const client = clients.find(c => c.id === agreement.clientId);
    const matchesSearch = client?.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || agreement.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (id: string, status: AgreementStatus) => {
    updateAgreement(id, { status });
    toast.success(`Agreement ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
    setViewingAgreement(null);
  };

  const handleDownload = (agreement: Agreement) => {
    const client = clients.find(c => c.id === agreement.clientId);
    const content = `
WORKSPACE AGREEMENT
==================

Agreement ID: ${agreement.id}
Date: ${format(new Date(agreement.createdAt), 'MMMM d, yyyy')}
Status: ${agreement.status.toUpperCase()}

CLIENT INFORMATION
------------------
Company: ${client?.companyName || 'N/A'}
Contact: ${client?.contactPerson || 'N/A'}
Email: ${client?.email || 'N/A'}
Address: ${client?.address || 'N/A'}

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
Generated on ${format(new Date(), 'MMMM d, yyyy')}
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

  return (
    <DashboardLayout role="admin">
      <PageHeader 
        title="Agreement Management"
        description="Review and manage client agreements"
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
                <div>
                  <p className="font-medium">
                    {clients.find(c => c.id === viewingAgreement.clientId)?.companyName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Created {format(new Date(viewingAgreement.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
                <StatusBadge status={viewingAgreement.status} />
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
                <pre className="text-xs whitespace-pre-wrap p-4 bg-muted rounded-lg max-h-[150px] overflow-y-auto">
                  {viewingAgreement.termsAndConditions}
                </pre>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                {viewingAgreement.status === 'pending' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange(viewingAgreement.id, 'rejected')}
                      className="text-destructive"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleStatusChange(viewingAgreement.id, 'approved')}
                      className="bg-success hover:bg-success/90"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </>
                )}
                <Button variant="outline" onClick={() => handleDownload(viewingAgreement)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Input
          placeholder="Search by client..."
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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Agreements Table */}
      {filteredAgreements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No agreements found</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery || filterStatus !== 'all' ? 'Try different filters' : 'Agreements will appear here'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">All Agreements ({filteredAgreements.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Products</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Duration</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Value</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAgreements.map(agreement => {
                    const client = clients.find(c => c.id === agreement.clientId);
                    return (
                      <tr key={agreement.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <p className="font-medium text-sm">{client?.companyName || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(agreement.createdAt), 'MMM d, yyyy')}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-sm">{agreement.products.length} product(s)</td>
                        <td className="py-3 px-4 text-sm">
                          {format(new Date(agreement.startDate), 'MMM d')} - {format(new Date(agreement.endDate), 'MMM d')}
                        </td>
                        <td className="py-3 px-4 font-medium text-sm">${agreement.totalValue.toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={agreement.status} />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setViewingAgreement(agreement)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDownload(agreement)}>
                              <Download className="w-4 h-4" />
                            </Button>
                            {agreement.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleStatusChange(agreement.id, 'approved')}
                                  className="text-success"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleStatusChange(agreement.id, 'rejected')}
                                  className="text-destructive"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
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
