import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Building,
  User,
  Mail,
  Phone,
  Calendar,
  Package,
  IndianRupee,
  FileText,
  Download,
  ArrowLeft,
  Check,
  X,
  Clock,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  CalendarDays,
  FileCheck,
  MapPin,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Filter,
  Search,
  BarChart3,
  Send,
  Eye,
  Edit,
  Plus,
  Receipt
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Invoice, InvoiceStatus, Client, PRODUCT_TYPE_LABELS } from '@/types';
import { format, differenceInDays, isAfter, isBefore, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminClientInvoiceDetails() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { invoices: initialInvoices, clients: initialClients } = useData();

  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const client = clients.find(c => c.id === clientId);
  const clientInvoices = invoices.filter(i => i.clientId === clientId);

  // Filter invoices based on active tab and search
  const filteredInvoices = clientInvoices.filter(invoice => {
    // Apply tab filter
    if (activeTab !== 'all') {
      if (activeTab === 'pending') return invoice.status === 'pending';
      if (activeTab === 'sent') return invoice.status === 'sent';
      if (activeTab === 'paid') return invoice.status === 'paid';
      if (activeTab === 'draft') return invoice.status === 'draft';
      if (activeTab === 'overdue') return invoice.status === 'overdue';
      if (activeTab === 'active') {
        return invoice.status === 'sent' || invoice.status === 'pending';
      }
      if (activeTab === 'paid') return invoice.status === 'paid';
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const statusMatch = invoice.status.toLowerCase().includes(query);
      const invoiceNumberMatch = invoice.invoiceNumber.toLowerCase().includes(query);
      const productMatch = invoice.products.some(p => 
        p.type.toLowerCase().includes(query)
      );
      const amountMatch = invoice.total.toString().includes(query);
      
      return statusMatch || invoiceNumberMatch || productMatch || amountMatch;
    }

    return true;
  });

  // Sort invoices
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'date-asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'amount-desc':
        return b.total - a.total;
      case 'amount-asc':
        return a.total - b.total;
      case 'due-desc':
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      case 'due-asc':
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      default:
        return 0;
    }
  });

  useEffect(() => {
    const loadDataFromLocalStorage = () => {
      try {
        const storedInvoices = localStorage.getItem('invoices');
        const storedClients = localStorage.getItem('clients');

        if (storedInvoices) {
          const parsedInvoices = JSON.parse(storedInvoices);
          setInvoices(parsedInvoices);
        }

        if (storedClients) {
          const parsedClients = JSON.parse(storedClients);
          setClients(parsedClients);
        }
      } catch (error) {
        console.error('Error loading data from localStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDataFromLocalStorage();
  }, []);

  // Calculate statistics
  const stats = {
    totalAmount: clientInvoices.reduce((sum, i) => sum + i.total, 0),
    pending: clientInvoices.filter(i => i.status === 'pending').length,
    sent: clientInvoices.filter(i => i.status === 'sent').length,
    paid: clientInvoices.filter(i => i.status === 'paid').length,
    draft: clientInvoices.filter(i => i.status === 'draft').length,
    overdue: clientInvoices.filter(i => i.status === 'overdue').length,
    active: clientInvoices.filter(i => i.status === 'sent' || i.status === 'pending').length,
    total: clientInvoices.length,
    averageAmount: clientInvoices.length > 0 ? 
      clientInvoices.reduce((sum, i) => sum + i.total, 0) / clientInvoices.length : 0,
    pendingAmount: clientInvoices
      .filter(i => i.status === 'pending' || i.status === 'sent')
      .reduce((sum, i) => sum + i.total, 0),
    paidAmount: clientInvoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.total, 0)
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
        icon: AlertCircle,
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
        icon: Clock,
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
    
    if (days > 30) return { text: `${Math.floor(days/30)} months`, variant: 'default' as const };
    if (days > 7) return { text: `${days} days`, variant: 'default' as const };
    if (days > 0) return { text: `${days} days`, variant: 'secondary' as const };
    if (days === 0) return { text: 'Due today', variant: 'outline' as const };
    return { text: `${Math.abs(days)} days overdue`, variant: 'destructive' as const };
  };

  const handleStatusChange = async (id: string, status: InvoiceStatus) => {
    setIsLoading(true);
    try {
      const updatedInvoices = invoices.map(invoice => {
        if (invoice.id === id) {
          return {
            ...invoice,
            status,
            updatedAt: new Date().toISOString(),
          };
        }
        return invoice;
      });
      
      setInvoices(updatedInvoices);
      localStorage.setItem('invoices', JSON.stringify(updatedInvoices));

      toast.success(`Invoice marked as ${status}`);
    } catch (error) {
      toast.error('Failed to update invoice status');
    } finally {
      setIsLoading(false);
    }
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
Contact: ${client?.contactPerson || 'N/A'}
Email: ${client?.email || 'N/A'}
Phone: ${client?.phone || 'N/A'}
Address: ${client?.address || 'N/A'}

ITEMS
-----
${invoice.products.map(p => 
  `${PRODUCT_TYPE_LABELS[p.type] || p.type}: ${p.quantity} unit(s) @ ₹${p.pricePerUnit?.toLocaleString('en-IN') || p.totalPrice.toLocaleString('en-IN')}/unit = ₹${p.totalPrice.toLocaleString('en-IN')}`
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
    a.download = `invoice-${invoice.invoiceNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Invoice downloaded successfully');
  };

  const handleSendInvoice = (invoice: Invoice) => {
    handleStatusChange(invoice.id, 'sent');
    toast.success(`Invoice sent to ${client?.email}`);
  };

  const handleMarkPaid = (invoice: Invoice) => {
    handleStatusChange(invoice.id, 'paid');
  };

  if (!client) {
    return (
      <DashboardLayout role="admin">
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Client Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The client you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/admin/invoices')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Clients
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Breadcrumb and Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/invoices')}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Clients
            </Button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-medium text-foreground">{client.companyName}</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border flex items-center justify-center">
                  <Building className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight">{client.companyName}</h1>
                  <p className="text-muted-foreground mt-1">{client.contactPerson} • {client.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <Badge variant="outline" className="gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {client.phone}
                </Badge>
                <Badge variant="outline" className="gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {client.address}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/admin/invoices')}>
                Back to All Clients
              </Button>
              
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Amount</p>
                  <p className="text-2xl font-bold">
                    ₹{stats.totalAmount.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{stats.total} invoices</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Paid</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    ₹{stats.paidAmount.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{stats.paid} invoices paid</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pending</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    ₹{stats.pendingAmount.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{stats.active} awaiting payment</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Avg. Invoice</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    ₹{Math.round(stats.averageAmount).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Per invoice</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices, amounts, or status..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="sent">Sent</TabsTrigger>
                  <TabsTrigger value="paid">Paid</TabsTrigger>
                  <TabsTrigger value="draft">Draft</TabsTrigger>
                  <TabsTrigger value="overdue">Overdue</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Invoices List */}
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>
              {sortedInvoices.length} invoice{sortedInvoices.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted/30 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : sortedInvoices.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No invoices found</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  {searchQuery
                    ? 'No invoices match your search criteria'
                    : activeTab === 'all'
                    ? 'This client has no invoices yet.'
                    : `No ${activeTab} invoices found.`}
                </p>
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                )}
                {activeTab !== 'all' && (
                  <Button variant="outline" onClick={() => setActiveTab('all')}>
                    Show All Invoices
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedInvoices.map((invoice) => {
                  const statusConfig = getStatusConfig(invoice.status);
                  const StatusIcon = statusConfig.icon;
                  const daysRemaining = getDaysRemaining(invoice.dueDate);

                  return (
                    <Card key={invoice.id} className="overflow-hidden hover:shadow-md transition-all duration-200 border hover:border-primary/30">
                      <CardContent className="p-0">
                        <div className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                            {/* Left Column - Basic Info */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-lg">
                                      Invoice #{invoice.invoiceNumber}
                                    </h3>
                                    <Badge className={cn("gap-1.5", statusConfig.color)}>
                                      <StatusIcon className={cn("w-3.5 h-3.5", statusConfig.iconColor)} />
                                      {statusConfig.label}
                                    </Badge>
                                    <Badge variant={daysRemaining.variant} className="gap-1.5">
                                      <Clock className="w-3.5 h-3.5" />
                                      {daysRemaining.text}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                      <CalendarDays className="w-4 h-4" />
                                      Created {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                      <Calendar className="w-4 h-4" />
                                      Due {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                </div>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setSelectedInvoice(invoice)}>
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownload(invoice)}>
                                      <Download className="w-4 h-4 mr-2" />
                                      Download
                                    </DropdownMenuItem>
                                    {invoice.status === 'draft' && (
                                      <DropdownMenuItem onClick={() => handleSendInvoice(invoice)}>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Invoice
                                      </DropdownMenuItem>
                                    )}
                                    {(invoice.status === 'sent' || invoice.status === 'pending') && (
                                      <DropdownMenuItem onClick={() => handleMarkPaid(invoice)}>
                                        <Check className="w-4 h-4 mr-2" />
                                        Mark as Paid
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Details</Label>
                                  <div className="flex items-center justify-between bg-muted/20 p-3 rounded-lg">
                                    <span className="text-sm">Invoice Date</span>
                                    <span className="font-medium">
                                      {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between bg-muted/20 p-3 rounded-lg">
                                    <span className="text-sm">Due Date</span>
                                    <span className="font-medium">
                                      {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Items</Label>
                                  <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                    {invoice.products.map((product) => (
                                      <div
                                        key={product.id}
                                        className="flex items-center justify-between p-2 bg-muted/10 rounded"
                                      >
                                        <span className="text-sm font-medium">
                                          {PRODUCT_TYPE_LABELS[product.type] || product.type}
                                        </span>
                                        <Badge variant="outline" className="ml-auto mr-2">
                                          {product.quantity}
                                        </Badge>
                                        <span className="text-sm font-semibold">
                                          ₹{product.totalPrice.toLocaleString('en-IN')}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Financials</Label>
                                  <div className="bg-primary/5 p-4 rounded-lg">
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>₹{invoice.subtotal.toLocaleString('en-IN')}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Tax</span>
                                        <span>₹{invoice.tax.toLocaleString('en-IN')}</span>
                                      </div>
                                      <div className="flex items-center justify-between pt-2 border-t">
                                        <span className="font-medium">Total</span>
                                        <span className="text-xl font-bold text-primary">
                                          ₹{invoice.total.toLocaleString('en-IN')}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {invoice.notes && (
                                <div className="mb-4 p-3 bg-muted/20 rounded-lg">
                                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                                  <p className="text-sm">{invoice.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDownload(invoice)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => setSelectedInvoice(invoice)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                            {invoice.status === 'draft' && (
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => handleSendInvoice(invoice)}
                                disabled={isLoading}
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Send Invoice
                              </Button>
                            )}
                            {(invoice.status === 'sent' || invoice.status === 'pending') && (
                              <Button
                                size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => handleMarkPaid(invoice)}
                                disabled={isLoading}
                              >
                                <Check className="w-4 h-4 mr-2" />
                                Mark as Paid
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
          {sortedInvoices.length > 0 && (
            <CardFooter className="border-t px-6 py-4">
              <div className="w-full flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Showing {sortedInvoices.length} of {clientInvoices.length} invoices
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/invoices')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  View all clients
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* Invoice Details Dialog */}
      {/* Invoice Details Dialog */}
<Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Invoice Details</DialogTitle>
    </DialogHeader>
    {selectedInvoice && (() => {
      // Get status config inside this scope
      const selectedInvoiceStatusConfig = getStatusConfig(selectedInvoice.status);
      const SelectedStatusIcon = selectedInvoiceStatusConfig.icon;
      
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Invoice #{selectedInvoice.invoiceNumber}</h3>
              <p className="text-muted-foreground text-sm">
                Created {format(new Date(selectedInvoice.createdAt), 'MMMM d, yyyy')}
              </p>
            </div>
            <Badge className={cn("gap-1.5", selectedInvoiceStatusConfig.color)}>
              <SelectedStatusIcon className={cn("w-3.5 h-3.5", selectedInvoiceStatusConfig.iconColor)} />
              {selectedInvoiceStatusConfig.label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Invoice Date</Label>
              <p className="font-medium">{format(new Date(selectedInvoice.createdAt), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
              <p className="font-medium">{format(new Date(selectedInvoice.dueDate), 'MMM d, yyyy')}</p>
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium text-muted-foreground mb-3 block">Items</Label>
            <div className="space-y-3">
              {selectedInvoice.products.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                  <div>
                    <p className="font-medium">{PRODUCT_TYPE_LABELS[product.type] || product.type}</p>
                    <p className="text-sm text-muted-foreground">Quantity: {product.quantity}</p>
                  </div>
                  <p className="font-bold">₹{product.totalPrice.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>₹{selectedInvoice.subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>₹{selectedInvoice.tax.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-lg font-bold border-t pt-3">
              <span>Total</span>
              <span className="text-primary">₹{selectedInvoice.total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {selectedInvoice.notes && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">Notes</Label>
              <p className="text-sm bg-muted/20 p-3 rounded-lg">{selectedInvoice.notes}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => handleDownload(selectedInvoice)}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            {selectedInvoice.status === 'draft' && (
              <Button
                className="flex-1"
                onClick={() => {
                  handleSendInvoice(selectedInvoice);
                  setSelectedInvoice(null);
                }}
              >
                <Send className="w-4 h-4 mr-2" />
                Send Invoice
              </Button>
            )}
            {(selectedInvoice.status === 'sent' || selectedInvoice.status === 'pending') && (
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => {
                  handleMarkPaid(selectedInvoice);
                  setSelectedInvoice(null);
                }}
              >
                <Check className="w-4 h-4 mr-2" />
                Mark as Paid
              </Button>
            )}
          </div>
        </div>
      );
    })()}
  </DialogContent>
</Dialog>
    </DashboardLayout>
  );
}