import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Receipt, 
  Search, 
  Filter,
  Building,
  User,
  Mail,
  Calendar,
  Eye,
  ChevronRight,
  Plus,
  Download,
  Send,
  Check,
  AlertCircle,
  DollarSign,
  Clock,
  FileText,
  TrendingUp,
  BarChart3,
  IndianRupee,
  Trash2
} from 'lucide-react';
import { Invoice, InvoiceStatus, Client, Product, ProductType } from '@/types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { format, differenceInDays, parseISO, isBefore, addDays } from 'date-fns';

export default function AdminInvoices() {
  const { invoices: initialInvoices, clients: initialClients, products: initialProducts, addInvoice } = useData();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  
  // Create invoice modal state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [invoiceDate, setInvoiceDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState<string>(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [taxRate, setTaxRate] = useState<number>(18);
  const [notes, setNotes] = useState<string>('');
  const [customProducts, setCustomProducts] = useState<Array<{
    id: string;
    type: ProductType;
    customType?: string;
    description: string;
    quantity: number;
    price: number;
    total: number;
    startDate?: string;
    endDate?: string;
  }>>([]);

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadDataFromLocalStorage = () => {
      try {
        const storedInvoices = localStorage.getItem('invoices');
        const storedClients = localStorage.getItem('clients');
        const storedProducts = localStorage.getItem('products');

        if (storedInvoices) {
          const parsedInvoices = JSON.parse(storedInvoices);
          setInvoices(parsedInvoices);
        }

        if (storedClients) {
          const parsedClients = JSON.parse(storedClients);
          setClients(parsedClients);
        }

        if (storedProducts) {
          const parsedProducts = JSON.parse(storedProducts);
          setProducts(parsedProducts);
        }
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
      }
    };

    loadDataFromLocalStorage();

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'invoices') {
      try {
        const parsedInvoices = JSON.parse(e.newValue || '[]');
        setInvoices(parsedInvoices);
      } catch (error) {
        console.error('Error parsing invoices from storage:', error);
      }
    }
    if (e.key === 'clients') {
      try {
        const parsedClients = JSON.parse(e.newValue || '[]');
        setClients(parsedClients);
      } catch (error) {
        console.error('Error parsing clients from storage:', error);
      }
    }
    if (e.key === 'products') {
      try {
        const parsedProducts = JSON.parse(e.newValue || '[]');
        setProducts(parsedProducts);
      } catch (error) {
        console.error('Error parsing products from storage:', error);
      }
    }
  };

  // Group invoices by client
  const clientInvoices = clients.map(client => {
    const clientInvoices = invoices.filter(invoice => invoice.clientId === client.id);
    const paidInvoices = clientInvoices.filter(i => i.status === 'paid');
    const pendingInvoices = clientInvoices.filter(i => i.status === 'pending' || i.status === 'sent');
    const overdueInvoices = clientInvoices.filter(i => {
      if (i.status !== 'sent' && i.status !== 'pending') return false;
      return isBefore(parseISO(i.dueDate), new Date());
    });
    
    return {
      client,
      invoices: clientInvoices,
      totalInvoices: clientInvoices.length,
      totalAmount: clientInvoices.reduce((sum, i) => sum + i.total, 0),
      pendingAmount: pendingInvoices.reduce((sum, i) => sum + i.total, 0),
      paidAmount: paidInvoices.reduce((sum, i) => sum + i.total, 0),
      pendingInvoices: pendingInvoices.length,
      paidInvoices: paidInvoices.length,
      overdueInvoices: overdueInvoices.length,
      latestInvoice: clientInvoices.length > 0 
        ? clientInvoices[clientInvoices.length - 1] 
        : null,
    };
  }).filter(clientGroup => clientGroup.invoices.length > 0);

  // Filter client invoices
  const filteredClientInvoices = clientInvoices.filter(clientGroup => {
    const client = clientGroup.client;
    const matchesSearch = client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterClient !== 'all' && client.id !== filterClient) return false;
    
    if (filterStatus === 'all') return matchesSearch;
    
    return matchesSearch && clientGroup.invoices.some(i => i.status === filterStatus);
  });

  const handleViewClientInvoices = (clientId: string) => {
    navigate(`/admin/invoices/${clientId}`);
  };

  const handleDeleteInvoice = () => {
    if (!invoiceToDelete) return;

    try {
      const updatedInvoices = invoices.filter(i => i.id !== invoiceToDelete.id);
      setInvoices(updatedInvoices);
      localStorage.setItem('invoices', JSON.stringify(updatedInvoices));

      toast.success('Invoice deleted successfully');
    } catch (error) {
      toast.error('Failed to delete invoice');
      console.error('Error deleting invoice:', error);
    } finally {
      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const handleSendInvoice = (invoiceId: string) => {
    const updatedInvoices = invoices.map(invoice => {
      if (invoice.id === invoiceId) {
        return { ...invoice, status: 'sent' as InvoiceStatus };
      }
      return invoice;
    });
    
    setInvoices(updatedInvoices);
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
    
    const invoice = invoices.find(i => i.id === invoiceId);
    const client = clients.find(c => c.id === invoice?.clientId);
    
    toast.success(`Invoice sent to ${client?.email}`);
  };

  const handleMarkPaid = (invoiceId: string) => {
    const updatedInvoices = invoices.map(invoice => {
      if (invoice.id === invoiceId) {
        return { ...invoice, status: 'paid' as InvoiceStatus };
      }
      return invoice;
    });
    
    setInvoices(updatedInvoices);
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
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
  `${p.type} (${p.quantity}x)    ₹${p.totalPrice.toLocaleString('en-IN')}`
).join('\n')}

---------------------------------
Subtotal:    ₹${invoice.subtotal.toLocaleString('en-IN')}
Tax:         ₹${invoice.tax.toLocaleString('en-IN')}
---------------------------------
TOTAL:       ₹${invoice.total.toLocaleString('en-IN')}

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

  // Create Invoice Functions
  const resetCreateForm = () => {
    setSelectedClient('');
    setSelectedProducts([]);
    setInvoiceDate(format(new Date(), 'yyyy-MM-dd'));
    setDueDate(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
    setTaxRate(18);
    setNotes('');
    setCustomProducts([]);
  };

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const addCustomProduct = () => {
    const newProduct = {
      id: `custom-${Date.now()}`,
      type: 'work_desk' as ProductType,
      customType: '',
      description: '',
      quantity: 1,
      price: 0,
      total: 0,
      startDate: invoiceDate,
      endDate: dueDate
    };
    setCustomProducts([...customProducts, newProduct]);
  };

  const updateCustomProduct = (id: string, field: string, value: string | number | ProductType) => {
    setCustomProducts(prev => prev.map(product => {
      if (product.id === id) {
        const updated = { ...product, [field]: value };
        if (field === 'quantity' || field === 'price') {
          updated.total = updated.quantity * updated.price;
        }
        return updated;
      }
      return product;
    }));
  };

  const removeCustomProduct = (id: string) => {
    setCustomProducts(prev => prev.filter(product => product.id !== id));
  };

  // Calculate invoice totals
  const clientProducts = selectedClient 
    ? products.filter(p => p.clientId === selectedClient)
    : [];

  const selectedClientProducts = products.filter(p => selectedProducts.includes(p.id));
  
  const subtotal = selectedClientProducts.reduce((sum, p) => sum + p.totalPrice, 0) + 
                  customProducts.reduce((sum, p) => sum + p.total, 0);
  
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const handleCreateInvoice = () => {
    if (!selectedClient) {
      toast.error('Please select a client');
      return;
    }

    if (selectedProducts.length === 0 && customProducts.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    // Combine selected products and custom products
    const invoiceProducts = [
      ...selectedClientProducts,
      ...customProducts.map(cp => ({
        id: cp.id,
        clientId: selectedClient,
        type: cp.type,
        customType: cp.customType || undefined,
        quantity: cp.quantity,
        startDate: cp.startDate || invoiceDate,
        endDate: cp.endDate || dueDate,
        pricePerUnit: cp.price,
        totalPrice: cp.total,
        comments: cp.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active' as const
      }))
    ];

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    
    const newInvoice: Invoice = {
      id: `invoice-${Date.now()}`,
      clientId: selectedClient,
      products: invoiceProducts,
      invoiceNumber,
      subtotal,
      tax,
      total,
      status: 'draft' as InvoiceStatus,
      createdAt: invoiceDate,
      dueDate,
      notes: notes || undefined,
      updatedAt: new Date().toISOString()
    };

    try {
      const updatedInvoices = [...invoices, newInvoice];
      setInvoices(updatedInvoices);
      localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
      addInvoice(newInvoice);
      
      toast.success('Invoice created successfully');
      setCreateDialogOpen(false);
      resetCreateForm();
    } catch (error) {
      toast.error('Failed to create invoice');
      console.error('Error creating invoice:', error);
    }
  };

  const getStatusConfig = (status: InvoiceStatus) => {
    const configs = {
      paid: {
        icon: Check,
        label: 'Paid',
        color: 'bg-green-500/10 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
        iconColor: 'text-green-600 dark:text-green-400'
      },
      pending: {
        icon: Clock,
        label: 'Pending',
        color: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
        iconColor: 'text-amber-600 dark:text-amber-400'
      },
      sent: {
        icon: Send,
        label: 'Sent',
        color: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
        iconColor: 'text-blue-600 dark:text-blue-400'
      },
      draft: {
        icon: FileText,
        label: 'Draft',
        color: 'bg-gray-500/10 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
        iconColor: 'text-gray-600 dark:text-gray-400'
      },
      overdue: {
        icon: AlertCircle,
        label: 'Overdue',
        color: 'bg-red-500/10 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
        iconColor: 'text-red-600 dark:text-red-400'
      }
    };
    return configs[status] || configs.draft;
  };

  const getDaysRemaining = (dueDate: string) => {
    const due = parseISO(dueDate);
    const days = differenceInDays(due, new Date());
    
    if (days > 0) return { text: `${days} days`, variant: 'default' as const };
    if (days === 0) return { text: 'Due today', variant: 'secondary' as const };
    return { text: `${Math.abs(days)} days overdue`, variant: 'destructive' as const };
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader 
        title="Invoice Management"
        description="Manage client invoices and payments"
        actions={
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetCreateForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new invoice
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Client & Products */}
                <div className="space-y-6">
                  {/* Client Selection */}
                  <div className="space-y-3">
                    <Label>Client *</Label>
                    <Select
                      value={selectedClient}
                      onValueChange={(value) => {
                        setSelectedClient(value);
                        setSelectedProducts([]);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            <div className="flex flex-col">
                              <span>{client.companyName}</span>
                              <span className="text-xs text-muted-foreground">
                                {client.contactPerson} • {client.email}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Existing Products */}
                  {selectedClient && clientProducts.length > 0 && (
                    <div className="space-y-3">
                      <Label>Select Products</Label>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-2">
                        {clientProducts.map(product => (
                          <div
                            key={product.id}
                            className="flex items-center space-x-3 p-3 hover:bg-muted/50 rounded-lg"
                          >
                            <Checkbox
                              id={`product-${product.id}`}
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={() => handleProductToggle(product.id)}
                            />
                            <label 
                              htmlFor={`product-${product.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <p className="font-medium text-sm capitalize">{product.type.replace('_', ' ')}</p>
                              <p className="text-xs text-muted-foreground">
                                {product.quantity} units • ₹{product.totalPrice.toLocaleString('en-IN')}
                              </p>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom Products */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Custom Products</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addCustomProduct}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Product
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {customProducts.map((product) => (
                        <div key={product.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Product #{customProducts.indexOf(product) + 1}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCustomProduct(product.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-xs">Type</Label>
                              <Select
                                value={product.type}
                                onValueChange={(value: ProductType) => 
                                  updateCustomProduct(product.id, 'type', value)
                                }
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="private_cabin">Private Cabin</SelectItem>
                                  <SelectItem value="work_desk">Work Desk</SelectItem>
                                  <SelectItem value="floating_seat">Floating Seat</SelectItem>
                                  <SelectItem value="conference_room">Conference Room</SelectItem>
                                  <SelectItem value="meeting_room">Meeting Room</SelectItem>
                                  <SelectItem value="others">Others</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-xs">Quantity</Label>
                              <Input
                                type="number"
                                min="1"
                                value={product.quantity}
                                onChange={(e) => 
                                  updateCustomProduct(product.id, 'quantity', parseInt(e.target.value) || 1)
                                }
                                className="h-8"
                              />
                            </div>
                          </div>

                          {product.type === 'others' && (
                            <div className="space-y-2">
                              <Label className="text-xs">Custom Type</Label>
                              <Input
                                placeholder="Enter product type"
                                value={product.customType || ''}
                                onChange={(e) => 
                                  updateCustomProduct(product.id, 'customType', e.target.value)
                                }
                                className="h-8"
                              />
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <Label className="text-xs">Description</Label>
                            <Input
                              placeholder="Product description"
                              value={product.description}
                              onChange={(e) => 
                                updateCustomProduct(product.id, 'description', e.target.value)
                              }
                              className="h-8"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-xs">Start Date</Label>
                              <Input
                                type="date"
                                value={product.startDate || invoiceDate}
                                onChange={(e) => 
                                  updateCustomProduct(product.id, 'startDate', e.target.value)
                                }
                                className="h-8"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-xs">End Date</Label>
                              <Input
                                type="date"
                                value={product.endDate || dueDate}
                                onChange={(e) => 
                                  updateCustomProduct(product.id, 'endDate', e.target.value)
                                }
                                className="h-8"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs">Price per unit (₹)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={product.price}
                              onChange={(e) => 
                                updateCustomProduct(product.id, 'price', parseFloat(e.target.value) || 0)
                              }
                              className="h-8"
                            />
                          </div>
                          
                          <div className="pt-2 border-t">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Total</span>
                              <span className="font-medium">
                                ₹{product.total.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column - Invoice Details */}
                <div className="space-y-6">
                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Invoice Date *</Label>
                      <Input
                        type="date"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date *</Label>
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Tax Rate */}
                  <div className="space-y-2">
                    <Label>Tax Rate (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional notes for the invoice..."
                      rows={3}
                    />
                  </div>

                  {/* Invoice Summary */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <h4 className="font-medium">Invoice Summary</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Selected Products</span>
                        <span>{selectedProducts.length} items</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Custom Products</span>
                        <span>{customProducts.length} items</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{subtotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                        <span>₹{tax.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t">
                        <span>Total</span>
                        <span className="text-primary">₹{total.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    resetCreateForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCreateInvoice}
                  disabled={!selectedClient || (selectedProducts.length === 0 && customProducts.length === 0)}
                >
                  Create Invoice
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete invoice {invoiceToDelete?.invoiceNumber}? 
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteInvoice}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients, invoice numbers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span>{filterStatus === 'all' ? 'All Status' : filterStatus}</span>
              </div>
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
          <Select value={filterClient} onValueChange={setFilterClient}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Client Cards Grid */}
      {filteredClientInvoices.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Receipt className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No invoices found</h3>
            <p className="text-muted-foreground text-sm text-center">
              {searchQuery || filterStatus !== 'all' || filterClient !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Clients with invoices will appear here'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClientInvoices.map(({ client, totalInvoices, totalAmount, pendingAmount, pendingInvoices, paidInvoices, overdueInvoices, latestInvoice }) => {
            const statusConfig = getStatusConfig(latestInvoice?.status || 'draft');
            const StatusIcon = statusConfig.icon;
            const daysRemaining = latestInvoice ? getDaysRemaining(latestInvoice.dueDate) : null;

            return (
              <Card 
                key={client.id} 
                className="hover:shadow-lg transition-all duration-300 hover:border-blue-200 cursor-pointer group"
                onClick={() => handleViewClientInvoices(client.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Building className="w-5 h-5 text-blue-500" />
                        {client.companyName}
                      </CardTitle>
                      <CardDescription className="mt-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{client.contactPerson}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span className="text-sm">{client.email}</span>
                        </div>
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {totalInvoices} invoice{totalInvoices !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  

                  {/* CTA Section */}
                  <div className="pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <div 
                        className="flex items-center gap-1 text-blue-600 group-hover:gap-2 transition-all cursor-pointer hover:text-blue-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewClientInvoices(client.id);
                        }}
                      >
                        <span>View Invoices</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                      <span className="text-muted-foreground">
                        {pendingInvoices > 0 ? `${pendingInvoices} pending` : 'All paid'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}