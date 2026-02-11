import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  User,
  Building,
  Calendar,
  FileCheck,
  Package,
  IndianRupee,
  AlertCircle,
  Clock,
  MoreVertical,
  Download,
  Copy,
  Plus,
  Eye,
  ChevronRight,
  Receipt,
  Activity
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Client, Product, Agreement, Invoice } from '@/types';

export default function AdminClientDetail() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { clients: contextClients, products: contextProducts, agreements: contextAgreements, invoices: contextInvoices, updateClient, deleteClient } = useData();
  
  const [client, setClient] = useState<Client | undefined>(() => contextClients.find(c => c.id === clientId));
  const [clientProducts, setClientProducts] = useState<Product[]>(() => contextProducts.filter(p => p.clientId === clientId));
  const [clientAgreements, setClientAgreements] = useState<Agreement[]>(() => contextAgreements.filter(a => a.clientId === clientId));
  const [clientInvoices, setClientInvoices] = useState<Invoice[]>(() => contextInvoices.filter(i => i.clientId === clientId));
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
  });
  
  const [activeTab, setActiveTab] = useState('products');
  const [isLoading, setIsLoading] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    const loadDataFromLocalStorage = () => {
      try {
        const storedClients = localStorage.getItem('clients');
        const storedProducts = localStorage.getItem('products');
        const storedAgreements = localStorage.getItem('agreements');
        const storedInvoices = localStorage.getItem('invoices');

        if (storedClients) {
          const parsedClients: Client[] = JSON.parse(storedClients);
          const foundClient = parsedClients.find(c => c.id === clientId);
          if (foundClient) setClient(foundClient);
        }

        if (storedProducts) {
          const parsedProducts: Product[] = JSON.parse(storedProducts);
          setClientProducts(parsedProducts.filter(p => p.clientId === clientId));
        }

        if (storedAgreements) {
          const parsedAgreements: Agreement[] = JSON.parse(storedAgreements);
          setClientAgreements(parsedAgreements.filter(a => a.clientId === clientId));
        }

        if (storedInvoices) {
          const parsedInvoices: Invoice[] = JSON.parse(storedInvoices);
          setClientInvoices(parsedInvoices.filter(i => i.clientId === clientId));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load client data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDataFromLocalStorage();

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [clientId]);

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'clients') {
      try {
        const parsedClients: Client[] = JSON.parse(e.newValue || '[]');
        const foundClient = parsedClients.find(c => c.id === clientId);
        if (foundClient) setClient(foundClient);
      } catch (error) {
        console.error('Error parsing clients from storage:', error);
      }
    }
    if (e.key === 'products') {
      try {
        const parsedProducts: Product[] = JSON.parse(e.newValue || '[]');
        setClientProducts(parsedProducts.filter(p => p.clientId === clientId));
      } catch (error) {
        console.error('Error parsing products from storage:', error);
      }
    }
    if (e.key === 'agreements') {
      try {
        const parsedAgreements: Agreement[] = JSON.parse(e.newValue || '[]');
        setClientAgreements(parsedAgreements.filter(a => a.clientId === clientId));
      } catch (error) {
        console.error('Error parsing agreements from storage:', error);
      }
    }
    if (e.key === 'invoices') {
      try {
        const parsedInvoices: Invoice[] = JSON.parse(e.newValue || '[]');
        setClientInvoices(parsedInvoices.filter(i => i.clientId === clientId));
      } catch (error) {
        console.error('Error parsing invoices from storage:', error);
      }
    }
  };

  // Calculate derived data
  const activeProducts = clientProducts.filter(p => p.status === 'active');
  const pendingAgreements = clientAgreements.filter(a => a.status === 'pending');
  const paidInvoices = clientInvoices.filter(i => i.status === 'paid');
  
  const totalValue = clientProducts.reduce((sum, p) => sum + p.totalPrice, 0);
  const totalInvoiceValue = clientInvoices.reduce((sum, i) => sum + i.total, 0);
  const paidInvoiceValue = paidInvoices.reduce((sum, i) => sum + i.total, 0);

  // Calculate stats
  const stats = {
    totalProducts: clientProducts.length,
    activeProducts: activeProducts.length,
    totalAgreements: clientAgreements.length,
    pendingAgreements: pendingAgreements.length,
    totalValue: totalValue,
    totalInvoices: clientInvoices.length,
    paidInvoices: paidInvoices.length,
    totalInvoiceValue: totalInvoiceValue,
    paidInvoiceValue: paidInvoiceValue,
    avgInvoiceValue: clientInvoices.length > 0 ? totalInvoiceValue / clientInvoices.length : 0,
    clientSince: client ? format(new Date(client.createdAt), 'MMM yyyy') : '',
    daysAsClient: client ? differenceInDays(new Date(), new Date(client.createdAt)) : 0
  };

  const handleEdit = () => {
    if (client) {
      setFormData({
        companyName: client.companyName,
        email: client.email,
        phone: client.phone,
        address: client.address,
        contactPerson: client.contactPerson,
      });
      setIsEditOpen(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (client) {
      try {
        updateClient(client.id, formData);
        
        setClient({
          ...client,
          ...formData,
          updatedAt: new Date().toISOString()
        });
        
        toast.success('Client updated successfully');
        setIsEditOpen(false);
      } catch (error) {
        console.error('Error updating client:', error);
        toast.error('Failed to update client');
      }
    }
  };

  const handleDelete = () => {
    if (client) {
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = () => {
    if (client) {
      try {
        deleteClient(client.id);
        toast.success('Client deleted successfully');
        navigate('/admin/clients');
      } catch (error) {
        console.error('Error deleting client:', error);
        toast.error('Failed to delete client');
      } finally {
        setIsDeleteDialogOpen(false);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string, iconColor: string }> = {
      active: { color: 'bg-green-500/10 text-green-700 border-green-200', iconColor: 'text-green-600' },
      pending: { color: 'bg-amber-500/10 text-amber-700 border-amber-200', iconColor: 'text-amber-600' },
      draft: { color: 'bg-gray-500/10 text-gray-700 border-gray-200', iconColor: 'text-gray-600' },
      approved: { color: 'bg-green-500/10 text-green-700 border-green-200', iconColor: 'text-green-600' },
      paid: { color: 'bg-green-500/10 text-green-700 border-green-200', iconColor: 'text-green-600' },
      expired: { color: 'bg-red-500/10 text-red-700 border-red-200', iconColor: 'text-red-600' },
      sent: { color: 'bg-blue-500/10 text-blue-700 border-blue-200', iconColor: 'text-blue-600' },
      overdue: { color: 'bg-red-500/10 text-red-700 border-red-200', iconColor: 'text-red-600' },
      completed: { color: 'bg-green-500/10 text-green-700 border-green-200', iconColor: 'text-green-600' },
      cancelled: { color: 'bg-gray-500/10 text-gray-700 border-gray-200', iconColor: 'text-gray-600' },
      rejected: { color: 'bg-red-500/10 text-red-700 border-red-200', iconColor: 'text-red-600' },
    };
    return configs[status] || configs.draft;
  };

  if (isLoading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading client data...</div>
        </div>
      </DashboardLayout>
    );
  }

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
            <Button onClick={() => navigate('/admin/clients')}>
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
      <PageHeader 
        title="Client Details"
        description={`Manage and view details for ${client.companyName}`}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete <strong>{client.companyName}</strong>? 
              This will also delete all associated products, agreements, and invoices. 
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Client
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update the client information. All changes will be reflected immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  required
                  placeholder="Enter company name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person *</Label>
                  <Input
                    id="contactPerson"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                    required
                    placeholder="Enter contact person name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  placeholder="Enter email address"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Company Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  required
                  placeholder="Enter complete address"
                  rows={4}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {/* Client Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border flex items-center justify-center">
                  <Building className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">{client.companyName}</h1>
                  <p className="text-muted-foreground mt-1 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {client.contactPerson}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {client.email}
                    </span>
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <Badge variant="outline" className="gap-1.5">
                      <Phone className="w-3.5 h-3.5" />
                      {client.phone}
                    </Badge>
                    <Badge variant="outline" className="gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {client.address}
                    </Badge>
                    <Badge variant="outline" className="gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Client since {stats.clientSince}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Client
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => copyToClipboard(client.email)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Email
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => copyToClipboard(client.id)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Client ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Client
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Value</p>
                  <p className="text-2xl font-bold">
                    ₹{stats.totalValue.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{stats.totalProducts} products</p>
            </CardContent> 
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Active Products</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.activeProducts}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{stats.totalProducts} total products</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pending Agreements</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {stats.pendingAgreements}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <FileCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{stats.totalAgreements} total agreements</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Paid Invoices</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.paidInvoices}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">₹{stats.paidInvoiceValue.toLocaleString('en-IN')} total</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card>
          <CardHeader className="pb-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <TabsList className="w-full lg:w-auto justify-start overflow-x-auto">
                  <TabsTrigger value="products" className="gap-2">
                    <Package className="w-4 h-4" />
                    Products ({clientProducts.length})
                  </TabsTrigger>
                  <TabsTrigger value="agreements" className="gap-2">
                    <FileCheck className="w-4 h-4" />
                    Agreements ({clientAgreements.length})
                  </TabsTrigger>
                  <TabsTrigger value="invoices" className="gap-2">
                    <Receipt className="w-4 h-4" />
                    Invoices ({clientInvoices.length})
                  </TabsTrigger>
                  <TabsTrigger value="info" className="gap-2">
                    <User className="w-4 h-4" />
                    Contact Info
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="products">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <CardTitle>Products & Services</CardTitle>
                        <CardDescription>
                          All products assigned to {client.companyName}
                        </CardDescription>
                      </div>
                      
                    </div>
                  </CardHeader>
                  <CardContent>
                    {clientProducts.length === 0 ? (
                      <div className="text-center py-12">
                        <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">No products assigned</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-6">
                          This client doesn't have any products or services assigned yet.
                        </p>
                        <Button 
                          onClick={() => navigate(`/admin/products`)}
                          variant="outline"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Product
                        </Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {clientProducts.map(product => (
                          <Card key={product.id} className="hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate(`/admin/products`)}>
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Package className="w-5 h-5 text-primary" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">
                                      {product.type.replace('_', ' ')}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      {product.quantity} units
                                    </p>
                                  </div>
                                </div>
                                <Badge className={cn("gap-1.5", getStatusBadge(product.status).color)}>
                                  {product.status}
                                </Badge>
                              </div>
                              
                              <div className="space-y-3 mb-6">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Price per unit</span>
                                  <span className="font-medium">₹{product.pricePerUnit.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Total value</span>
                                  <span className="text-lg font-bold text-primary">
                                    ₹{product.totalPrice.toLocaleString('en-IN')}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-muted-foreground">Duration</span>
                                  <span className="font-medium">
                                    {format(new Date(product.startDate), 'MMM d')} - {format(new Date(product.endDate), 'MMM d, yyyy')}
                                  </span>
                                </div>
                              </div>
                              
                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/admin/products`);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                  {clientProducts.length > 0 && (
                    <CardFooter className="border-t">
                      <Button 
                        variant="ghost" 
                        className="w-full"
                        onClick={() => navigate(`/admin/products`)}
                      >
                        View all {clientProducts.length} products
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="agreements">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <CardTitle>Agreements</CardTitle>
                        <CardDescription>
                          All agreements with {client.companyName}
                        </CardDescription>
                      </div>
                     
                    </div>
                  </CardHeader>
                  <CardContent>
                    {clientAgreements.length === 0 ? (
                      <div className="text-center py-12">
                        <FileCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">No agreements yet</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-6">
                          This client doesn't have any agreements yet.
                        </p>
                        <Button 
                          onClick={() => navigate(`/admin/agreements/new?clientId=${client.id}`)}
                          variant="outline"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Agreement
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {clientAgreements.map(agreement => {
                          const statusConfig = getStatusBadge(agreement.status);
                          const daysRemaining = agreement.status === 'approved' ? 
                            differenceInDays(parseISO(agreement.endDate), new Date()) : null;
                          
                          return (
                            <Card key={agreement.id} className="hover:shadow-md transition-shadow cursor-pointer"
                                  onClick={() => navigate(`/admin/agreements/client-1`)}>
                              <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                      <div>
                                        <h4 className="font-semibold text-lg mb-2">
                                          Agreement #{agreement.id.slice(-8)}
                                        </h4>
                                        <div className="flex items-center gap-3 mb-4">
                                          <Badge className={cn("gap-1.5", statusConfig.color)}>
                                            {agreement.status}
                                          </Badge>
                                          {daysRemaining !== null && (
                                            <Badge variant="outline" className="gap-1.5">
                                              <Clock className="w-3.5 h-3.5" />
                                              {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-2xl font-bold text-primary">
                                          ₹{agreement.totalValue.toLocaleString('en-IN')}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          {agreement.products.length} products
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                      <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Start Date</Label>
                                        <p className="font-medium">
                                          {format(parseISO(agreement.startDate), 'MMM d, yyyy')}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium text-muted-foreground">End Date</Label>
                                        <p className="font-medium">
                                          {format(parseISO(agreement.endDate), 'MMM d, yyyy')}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex gap-3">
                                  <Button 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/admin/agreements/client-1`);
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </Button>
                                  <Button variant="outline" className="flex-1">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                  {clientAgreements.length > 0 && (
                    <CardFooter className="border-t">
                      <Button 
                        variant="ghost" 
                        className="w-full"
                        onClick={() => navigate(`/admin/agreements?clientId=${client.id}`)}
                      >
                        View all {clientAgreements.length} agreements
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="invoices">
                <Card>
                  <CardHeader>
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <CardTitle>Invoices</CardTitle>
                        <CardDescription>
                          All invoices sent to {client.companyName}
                        </CardDescription>
                      </div>
                      
                    </div>
                  </CardHeader>
                  <CardContent>
                    {clientInvoices.length === 0 ? (
                      <div className="text-center py-12">
                        <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-6">
                          No invoices have been sent to this client yet.
                        </p>
                        <Button 
                          onClick={() => navigate(`/admin/invoices/new?clientId=${client.id}`)}
                          variant="outline"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Invoice
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {clientInvoices.map(invoice => {
                          const statusConfig = getStatusBadge(invoice.status);
                          
                          return (
                            <Card key={invoice.id} className="hover:shadow-md transition-shadow cursor-pointer"
                                  onClick={() => navigate(`/admin/invoices/client-1`)}>
                              <CardContent className="p-6">
                                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between mb-4">
                                      <div>
                                        <h4 className="font-semibold text-lg mb-2">
                                          Invoice #{invoice.invoiceNumber}
                                        </h4>
                                        <div className="flex items-center gap-3 mb-4">
                                          <Badge className={cn("gap-1.5", statusConfig.color)}>
                                            {invoice.status}
                                          </Badge>
                                          <Badge variant="outline" className="gap-1.5">
                                            <Calendar className="w-3.5 h-3.5" />
                                            Due {format(new Date(invoice.dueDate), 'MMM d')}
                                          </Badge>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-2xl font-bold text-primary">
                                          ₹{invoice.total.toLocaleString('en-IN')}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          {invoice.products.length} items
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                      <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Issued Date</Label>
                                        <p className="font-medium">
                                          {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                                        </p>
                                      </div>
                                      <div>
                                        <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
                                        <p className="font-medium">
                                          {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex gap-3">
                                  <Button variant="outline" className="flex-1">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/admin/invoices/client-1`);
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                  {clientInvoices.length > 0 && (
                    <CardFooter className="border-t">
                      <Button 
                        variant="ghost" 
                        className="w-full"
                        onClick={() => navigate(`/admin/invoices?clientId=${client.id}`)}
                      >
                        View all {clientInvoices.length} invoices
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="info">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>
                      Complete contact details for {client.companyName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium mb-4">Primary Details</h3>
                          <div className="space-y-4">
                            <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Building className="w-5 h-5 text-primary" />
                              </div>
                              <div className="flex-1">
                                <Label className="text-sm font-medium text-muted-foreground">Company Name</Label>
                                <p className="font-medium">{client.companyName}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50">
                              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-green-600" />
                              </div>
                              <div className="flex-1">
                                <Label className="text-sm font-medium text-muted-foreground">Contact Person</Label>
                                <p className="font-medium">{client.contactPerson}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium mb-4">Contact Details</h3>
                          <div className="space-y-4">
                            <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50">
                              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Mail className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                                <p className="font-medium">{client.email}</p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => copyToClipboard(client.email)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50">
                              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                <Phone className="w-5 h-5 text-purple-600" />
                              </div>
                              <div className="flex-1">
                                <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                                <p className="font-medium">{client.phone}</p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => copyToClipboard(client.phone)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium mb-4">Company Address</h3>
                          <div className="p-4 border rounded-lg bg-muted/20">
                            <div className="flex items-start gap-3 mb-4">
                              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-amber-600" />
                              </div>
                              <div className="flex-1">
                                <Label className="text-sm font-medium text-muted-foreground">Full Address</Label>
                                <p className="font-medium whitespace-pre-line">{client.address}</p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => copyToClipboard(client.address)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium mb-4">Additional Information</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <Label className="text-sm font-medium text-muted-foreground">Client Since</Label>
                                <p className="font-medium">{stats.clientSince}</p>
                              </div>
                              <Calendar className="w-5 h-5 text-muted-foreground" />
                            </div>
                            
                            <div className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <Label className="text-sm font-medium text-muted-foreground">Client ID</Label>
                                <p className="font-medium font-mono text-sm">{client.id}</p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => copyToClipboard(client.id)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardHeader>
        </Card>
      </div>
    </DashboardLayout>
  );
}