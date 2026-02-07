import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import StatusBadge from '@/components/dashboard/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger, 
  SelectValue,
} from '@/components/ui/select';
import { Badge } from "@/components/ui/badge";
import { 
  Receipt, 
  Search, 
  Filter,
  Building,
  User,
  Mail,
  Calendar,
  Eye,
  Download,
  Check,
  AlertCircle,
  Clock,
  FileText,
  IndianRupee,
  MoreVertical,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  FileBarChart,
  TrendingUp,
  CheckCircle,
  XCircle,
  BarChart3
} from 'lucide-react';
import { Invoice, InvoiceStatus, Client, ProductType, PRODUCT_TYPE_LABELS } from '@/types';
import { toast } from 'sonner';
import { format, differenceInDays, parseISO, isBefore } from 'date-fns';

export default function ClientInvoices() {
  const { user } = useAuth();
  const { invoices: initialInvoices, clients: initialClients, products: initialProducts } = useData();
  
  
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [products, setProducts] = useState(initialProducts);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Invoice;
    direction: 'asc' | 'desc';
  }>({ key: 'createdAt', direction: 'desc' });


  // Get current client based on logged-in user
  const currentClient = clients.find(c => c.companyName === user?.companyName);
  
  // Filter invoices for the current client only
  const clientInvoices = invoices.filter(invoice => invoice.clientId === currentClient?.id);

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
  };

  // Handle sort
  const handleSort = (key: keyof Invoice) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filter invoices based on search and filters
  const filteredInvoices = clientInvoices.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.status.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || invoice.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Sort filtered invoices
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (sortConfig.key === 'total' || sortConfig.key === 'subtotal' || sortConfig.key === 'tax') {
      return sortConfig.direction === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    }
    
    if (sortConfig.key === 'createdAt' || sortConfig.key === 'dueDate') {
      const aDate = new Date(aValue as string);
      const bDate = new Date(bValue as string);
      return sortConfig.direction === 'asc' 
        ? aDate.getTime() - bDate.getTime()
        : bDate.getTime() - aDate.getTime();
    }
    
    // For string values
    return sortConfig.direction === 'asc'
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  // Calculate statistics for current client
  const stats = {
    total: clientInvoices.length,
    paid: clientInvoices.filter(i => i.status === 'paid').length,
    pending: clientInvoices.filter(i => i.status === 'pending' || i.status === 'sent').length,
    overdue: clientInvoices.filter(i => {
      if (i.status !== 'sent' && i.status !== 'pending') return false;
      return isBefore(parseISO(i.dueDate), new Date());
    }).length,
    totalAmount: clientInvoices.reduce((sum, i) => sum + i.total, 0),
    paidAmount: clientInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0),
    pendingAmount: clientInvoices.filter(i => i.status === 'pending' || i.status === 'sent').reduce((sum, i) => sum + i.total, 0),
  };

  const getStatusConfig = (status: InvoiceStatus) => {
    const configs = {
      paid: {
        icon: CheckCircle,
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
        icon: FileText,
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
    
    if (days > 0) {
      return {
        text: `${days} days`,
        variant: 'default' as const,
        icon: Clock,
        iconColor: 'text-blue-600'
      };
    } else if (days === 0) {
      return {
        text: 'Due today',
        variant: 'outline' as const,
        icon: Clock,
        iconColor: 'text-amber-600'
      };
    } else {
      return {
        text: `${Math.abs(days)} days overdue`,
        variant: 'destructive' as const,
        icon: AlertCircle,
        iconColor: 'text-red-600'
      };
    }
  };

  const handleDownload = (invoice: Invoice) => {
    const client = clients.find(c => c.id === invoice.clientId) || currentClient;
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
${invoice.products.map(p => {
  const productName = p.type === 'others' && p.customType ? p.customType : PRODUCT_TYPE_LABELS[p.type as ProductType] || p.type;
  return `${productName} (${p.quantity}x)    ₹${p.totalPrice.toLocaleString('en-IN')}`;
}).join('\n')}

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
    toast.success('Invoice downloaded successfully');
  };

  // Copy invoice ID to clipboard
  const copyInvoiceId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('Invoice ID copied to clipboard');
  };

  if (!currentClient) {
    return (
      <DashboardLayout role="client">
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Building className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Client Not Found</h2>
            <p className="text-muted-foreground mb-6">
              Unable to load your client profile. Please contact support.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="client">
      <PageHeader 
        title="Invoices"
        description="View and download your invoices"
      />


      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search invoice numbers or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
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
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>
            {sortedInvoices.length} invoice{sortedInvoices.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedInvoices.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No invoices found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'No invoices have been issued to your account yet.'}
              </p>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">
                      <div className="flex items-center gap-1">
                        Invoice #
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={() => handleSort('invoiceNumber')}
                        >
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Status
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={() => handleSort('status')}
                        >
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Issue Date
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={() => handleSort('createdAt')}
                        >
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Due Date
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={() => handleSort('dueDate')}
                        >
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        Days Remaining
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        Total Amount
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={() => handleSort('total')}
                        >
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedInvoices.map((invoice) => {
                    const statusConfig = getStatusConfig(invoice.status);
                    const StatusIcon = statusConfig.icon;
                    const daysRemaining = getDaysRemaining(invoice.dueDate);
                    const DaysIcon = daysRemaining.icon;
                    
                    return (
                      <TableRow key={invoice.id} className="hover:bg-muted/50 group">
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-medium">{invoice.invoiceNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              ID: {invoice.id.slice(0, 8)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`gap-1.5 ${statusConfig.color}`}>
                            <StatusIcon className={`w-3 h-3 ${statusConfig.iconColor}`} />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">
                              {format(parseISO(invoice.createdAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">
                              {format(parseISO(invoice.dueDate), 'MMM d, yyyy')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={daysRemaining.variant} className="gap-1.5">
                            <DaysIcon className="w-3 h-3" />
                            {daysRemaining.text}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1 justify-end">
                              <IndianRupee className="w-4 h-4 text-muted-foreground" />
                              <span className="font-bold text-lg">{invoice.total.toLocaleString('en-IN')}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {invoice.products.length} item{invoice.products.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setViewingInvoice(invoice)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownload(invoice)}>
                                <Download className="w-4 h-4 mr-2" />
                                Download Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => copyInvoiceId(invoice.id)}>
                                <Copy className="w-4 h-4 mr-2" />
                                Copy Invoice ID
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        {sortedInvoices.length > 0 && (
          <CardFooter className="border-t px-6 py-4">
            <div className="w-full flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing {sortedInvoices.length} of {clientInvoices.length} invoices
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium">1 of 1</span>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>

      {/* View Invoice Details Dialog */}
      <Dialog open={!!viewingInvoice} onOpenChange={() => setViewingInvoice(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              Complete invoice information and breakdown
            </DialogDescription>
          </DialogHeader>
          {viewingInvoice && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{viewingInvoice.invoiceNumber}</h3>
                  <p className="text-sm text-muted-foreground">
                    Invoice ID: {viewingInvoice.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <Badge className={`gap-1.5 ${getStatusConfig(viewingInvoice.status).color}`}>
                  {React.createElement(getStatusConfig(viewingInvoice.status).icon, {
                    className: `w-3.5 h-3.5 ${getStatusConfig(viewingInvoice.status).iconColor}`
                  })}
                  {getStatusConfig(viewingInvoice.status).label}
                </Badge>
              </div>

              {/* Client Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Company</Label>
                        <p className="font-medium">{currentClient.companyName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Contact Person</Label>
                        <p className="font-medium">{currentClient.contactPerson}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                        <p className="font-medium flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {currentClient.email}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                        <p className="font-medium flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          {currentClient.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Dates
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Issue Date</Label>
                      <p className="font-medium">{format(parseISO(viewingInvoice.createdAt), 'PPP')}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Due Date</Label>
                      <p className="font-medium">{format(parseISO(viewingInvoice.dueDate), 'PPP')}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Payment Terms</Label>
                      <p className="font-medium">
                        {differenceInDays(parseISO(viewingInvoice.dueDate), parseISO(viewingInvoice.createdAt))} days
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileBarChart className="w-4 h-4" />
                      Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Products</Label>
                      <p className="font-medium">{viewingInvoice.products.length} items</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Subtotal</Label>
                      <p className="font-medium flex items-center gap-1">
                        <IndianRupee className="w-4 h-4" />
                        {viewingInvoice.subtotal.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Tax</Label>
                      <p className="font-medium flex items-center gap-1">
                        <IndianRupee className="w-4 h-4" />
                        {viewingInvoice.tax.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Total
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <IndianRupee className="w-6 h-6 text-primary" />
                      <p className="text-2xl font-bold text-primary">
                        {viewingInvoice.total.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Includes all taxes and fees
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Products Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Products & Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewingInvoice.products.map((product) => {
                          const productName = product.type === 'others' && product.customType 
                            ? product.customType 
                            : PRODUCT_TYPE_LABELS[product.type as ProductType] || product.type;
                          
                          return (
                            <TableRow key={product.id}>
                              <TableCell className="font-medium">
                                <div>
                                  <p className="capitalize">{productName}</p>
                                  {product.comments && (
                                    <p className="text-xs text-muted-foreground">{product.comments}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{product.quantity}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <IndianRupee className="w-4 h-4 text-muted-foreground" />
                                  {product.pricePerUnit?.toLocaleString('en-IN') || '0'}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center gap-1 justify-end">
                                  <IndianRupee className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-medium">{product.totalPrice.toLocaleString('en-IN')}</span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {viewingInvoice.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Additional Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <p className="text-sm">{viewingInvoice.notes}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button variant="outline" onClick={() => setViewingInvoice(null)}>
                  Close
                </Button>
                <Button onClick={() => handleDownload(viewingInvoice)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Invoice
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}