import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  FileText,
  FileCheck,
  Package,
  IndianRupee,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  MoreVertical,
  Download,
  Copy,
  Plus,
  Eye,
  ChevronRight
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function AdminClientDetail() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { clients, products, agreements, invoices, updateClient, deleteClient } = useData();
  
  const client = clients.find(c => c.id === clientId);
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
  });

  if (!client) {
    return (
      <DashboardLayout role="admin">
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Client Not Found</h1>
          <p className="text-muted-foreground mb-6 max-w-md">
            The client you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate('/admin/clients')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Clients
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Get client data
  const clientProducts = products.filter(p => p.clientId === clientId);
  const clientAgreements = agreements.filter(a => a.clientId === clientId);
  const clientInvoices = invoices.filter(i => i.clientId === clientId);
  
  const activeProducts = clientProducts.filter(p => p.status === 'active');
  const pendingAgreements = clientAgreements.filter(a => a.status === 'pending');
  
  const totalValue = clientProducts.reduce((sum, p) => sum + p.totalPrice, 0);

  const handleEdit = () => {
    setFormData({
      companyName: client.companyName,
      email: client.email,
      phone: client.phone,
      address: client.address,
      contactPerson: client.contactPerson,
    });
    setIsEditOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (client) {
      updateClient(client.id, formData);
      toast.success('Client updated successfully');
      setIsEditOpen(false);
    }
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteClient(client.id);
      toast.success('Client deleted successfully');
      navigate('/admin/clients');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <DashboardLayout role="admin">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/admin/clients')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
        
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-1">{client.companyName}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                {client.contactPerson}
              </p>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Client since {format(new Date(client.createdAt), 'MMM yyyy')}
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="text-sm text-muted-foreground">
                  ID: {client.id.slice(0, 8)}...
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Products</p>
                <p className="text-2xl font-bold">{clientProducts.length}</p>
              </div>
              <Package className="w-8 h-8 text-primary/60" />
            </div>
            {activeProducts.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {activeProducts.length} active
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Agreements</p>
                <p className="text-2xl font-bold">{clientAgreements.length}</p>
              </div>
              <FileCheck className="w-8 h-8 text-green-500/60" />
            </div>
            {pendingAgreements.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {pendingAgreements.length} pending
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Value</p>
                <p className="text-2xl font-bold">₹{totalValue.toLocaleString('en-IN')}</p>
              </div>
              <IndianRupee className="w-8 h-8 text-amber-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="info" className="gap-2">
            <User className="w-4 h-4" />
            Contact Info
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Package className="w-4 h-4" />
            Products ({clientProducts.length})
          </TabsTrigger>
          <TabsTrigger value="agreements" className="gap-2">
            <FileCheck className="w-4 h-4" />
            Agreements ({clientAgreements.length})
          </TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2">
            <FileText className="w-4 h-4" />
            Invoices ({clientInvoices.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="info" className="space-y-6">
          <div className="max-w-2xl">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Contact Details</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{client.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <Phone className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">{client.phone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Address</p>
                          <p className="font-medium">{client.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => navigate(`/admin/agreements/new?clientId=${client.id}`)}
                      >
                        <FileCheck className="w-4 h-4 mr-3" />
                        Create New Agreement
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => navigate(`/admin/invoices/new?clientId=${client.id}`)}
                      >
                        <FileText className="w-4 h-4 mr-3" />
                        Create New Invoice
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={() => navigate(`/admin/products/new?clientId=${client.id}`)}
                      >
                        <Package className="w-4 h-4 mr-3" />
                        Add New Product
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="products">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Products & Services</h3>
                <p className="text-sm text-muted-foreground">
                  All products assigned to this client
                </p>
              </div>
              <Button onClick={() => navigate(`/admin/products/new?clientId=${client.id}`)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
            
            {clientProducts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No products assigned yet</p>
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/admin/products/new?clientId=${client.id}`)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Product
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clientProducts.slice(0, 6).map(product => (
                  <Card key={product.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium mb-1">
                            {product.type.replace('_', ' ')}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {product.quantity} units • ₹{product.totalPrice.toLocaleString('en-IN')}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          product.status === 'active' ? 'bg-green-100 text-green-700' :
                          product.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {product.status}
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground mb-4">
                        {format(new Date(product.startDate), 'MMM d')} - {format(new Date(product.endDate), 'MMM d, yyyy')}
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => navigate(`/admin/products/${product.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                
                {clientProducts.length > 6 && (
                  <div className="md:col-span-2">
                    <Button 
                      variant="ghost" 
                      className="w-full"
                      onClick={() => navigate(`/admin/products?clientId=${client.id}`)}
                    >
                      View all {clientProducts.length} products
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="agreements">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Agreements</h3>
                <p className="text-sm text-muted-foreground">
                  All agreements with this client
                </p>
              </div>
              <Button onClick={() => navigate(`/admin/agreements/new?clientId=${client.id}`)}>
                <Plus className="w-4 h-4 mr-2" />
                New Agreement
              </Button>
            </div>
            
            {clientAgreements.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileCheck className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No agreements yet</p>
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/admin/agreements/new?clientId=${client.id}`)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Agreement
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {clientAgreements.slice(0, 4).map(agreement => (
                  <Card key={agreement.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium mb-1">
                            Agreement #{agreement.id.slice(-6)}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(agreement.startDate), 'MMM d, yyyy')} - {format(new Date(agreement.endDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          agreement.status === 'approved' ? 'bg-green-100 text-green-700' :
                          agreement.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {agreement.status}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm mb-4">
                        <span className="text-muted-foreground">
                          {agreement.products.length} products
                        </span>
                        <span className="font-medium">
                          ₹{agreement.totalValue.toLocaleString('en-IN')}
                        </span>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => navigate(`/admin/agreements/${agreement.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Agreement
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                
                {clientAgreements.length > 4 && (
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => navigate(`/admin/agreements?clientId=${client.id}`)}
                  >
                    View all {clientAgreements.length} agreements
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="invoices">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Invoices</h3>
                <p className="text-sm text-muted-foreground">
                  All invoices sent to this client
                </p>
              </div>
              <Button onClick={() => navigate(`/admin/invoices/new?clientId=${client.id}`)}>
                <Plus className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
            </div>
            
            {clientInvoices.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No invoices yet</p>
                  <Button 
                    variant="outline"
                    onClick={() => navigate(`/admin/invoices/new?clientId=${client.id}`)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Invoice
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {clientInvoices.slice(0, 4).map(invoice => (
                  <Card key={invoice.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium mb-1">
                            Invoice #{invoice.invoiceNumber}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Due {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                          invoice.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {invoice.status}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm mb-4">
                        <span className="text-muted-foreground">
                          {invoice.products.length} items
                        </span>
                        <span className="font-medium">
                          ₹{invoice.total.toLocaleString('en-IN')}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => navigate(`/admin/invoices/${invoice.id}`)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {clientInvoices.length > 4 && (
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => navigate(`/admin/invoices?clientId=${client.id}`)}
                  >
                    View all {clientInvoices.length} invoices
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Client Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update the client information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={formData.companyName}
                onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">q
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Company Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                required
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}