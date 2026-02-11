import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import StatusBadge from '@/components/dashboard/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Package,
  IndianRupee,
  AlertCircle,
  Clock,
  MoreVertical,
  Copy,
  ChevronRight,
  Users,
  CalendarDays,
  FileText,
  Tag
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Product, ProductType, PRODUCT_TYPE_LABELS, Client } from '@/types';

export default function AdminProductsDetails() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { products, clients, updateProduct, deleteProduct } = useData();
  
  const [product, setProduct] = useState<Product | undefined>(() => 
    products.find(p => p.id === productId)
  );
  const [client, setClient] = useState<Client | undefined>(() => 
    product ? clients.find(c => c.id === product.clientId) : undefined
  );
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'private_cabin' as ProductType,
    customType: '',
    quantity: 1,
    startDate: '',
    endDate: '',
    pricePerUnit: 0,
    comments: '',
    clientId: '',
    status: 'pending' as Product['status'],
  });

  const defaultPrices: Record<ProductType, number> = {
    private_cabin: 15000,
    work_desk: 3500,
    floating_seat: 2000,
    conference_room: 2000,
    meeting_room: 1500,
    others: 0,
  };

  // Load data from localStorage
  useEffect(() => {
    const loadDataFromLocalStorage = () => {
      try {
        const storedProducts = localStorage.getItem('products');
        const storedClients = localStorage.getItem('clients');

        if (storedProducts) {
          const parsedProducts: Product[] = JSON.parse(storedProducts);
          const foundProduct = parsedProducts.find(p => p.id === productId);
          if (foundProduct) {
            setProduct(foundProduct);
            setFormData({
              type: foundProduct.type,
              customType: foundProduct.customType || '',
              quantity: foundProduct.quantity,
              startDate: foundProduct.startDate,
              endDate: foundProduct.endDate,
              pricePerUnit: foundProduct.pricePerUnit,
              comments: foundProduct.comments || '',
              clientId: foundProduct.clientId,
              status: foundProduct.status,
            });
          }
        }

        if (storedClients && product) {
          const parsedClients: Client[] = JSON.parse(storedClients);
          const foundClient = parsedClients.find(c => c.id === product.clientId);
          if (foundClient) setClient(foundClient);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load product data');
      }
    };

    loadDataFromLocalStorage();

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [productId, product]);

  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === 'products') {
      try {
        const parsedProducts: Product[] = JSON.parse(e.newValue || '[]');
        const foundProduct = parsedProducts.find(p => p.id === productId);
        if (foundProduct) {
          setProduct(foundProduct);
          setClient(clients.find(c => c.id === foundProduct.clientId));
        }
      } catch (error) {
        console.error('Error parsing products from storage:', error);
      }
    }
    if (e.key === 'clients') {
      try {
        const parsedClients: Client[] = JSON.parse(e.newValue || '[]');
        if (product) {
          const foundClient = parsedClients.find(c => c.id === product.clientId);
          if (foundClient) setClient(foundClient);
        }
      } catch (error) {
        console.error('Error parsing clients from storage:', error);
      }
    }
  };

  // Calculate derived data
  const daysRemaining = product ? differenceInDays(new Date(product.endDate), new Date()) : 0;
  const totalDuration = product ? differenceInDays(new Date(product.endDate), new Date(product.startDate)) : 0;
  const isExpired = daysRemaining < 0;
  const isActive = product?.status === 'active' && !isExpired;

  const getProductIcon = (type: ProductType) => {
    switch (type) {
      case 'private_cabin': return '🏢';
      case 'work_desk': return '💼';
      case 'floating_seat': return '💺';
      case 'conference_room': return '👥';
      case 'meeting_room': return '🗣️';
      default: return '📦';
    }
  };

  const getProductTypeLabel = (type: ProductType, customType?: string) => {
    return type === 'others' ? customType || 'Custom Product' : PRODUCT_TYPE_LABELS[type];
  };

  const handleEdit = () => {
    if (product) {
      setIsEditOpen(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (product) {
      try {
        const totalPrice = formData.quantity * formData.pricePerUnit;
        updateProduct(product.id, {
          ...formData,
          totalPrice,
        });
        
        setProduct({
          ...product,
          ...formData,
          totalPrice,
        });
        
        toast.success('Product updated successfully');
        setIsEditOpen(false);
      } catch (error) {
        console.error('Error updating product:', error);
        toast.error('Failed to update product');
      }
    }
  };

  const handleDelete = () => {
    if (product) {
      setIsDeleteDialogOpen(true);
    }
  };

  const confirmDelete = () => {
    if (product) {
      try {
        deleteProduct(product.id);
        toast.success('Product deleted successfully');
        navigate('/admin/products');
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      } finally {
        setIsDeleteDialogOpen(false);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleTypeChange = (type: ProductType) => {
    setFormData(prev => ({
      ...prev,
      type,
      pricePerUnit: defaultPrices[type],
    }));
  };

  if (!product) {
    return (
      <DashboardLayout role="admin">
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Product Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/admin/products')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Products
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <PageHeader 
        title="Product Details"
        description={`View and manage ${getProductTypeLabel(product.type, product.customType)}`}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete <strong>{getProductTypeLabel(product.type, product.customType)}</strong>? 
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update the product information. All changes will be reflected immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client</Label>
                <select
                  id="clientId"
                  value={formData.clientId}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.companyName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Product Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value as ProductType)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              
              {formData.type === 'others' && (
                <div className="space-y-2">
                  <Label htmlFor="customType">Custom Type</Label>
                  <Input
                    id="customType"
                    value={formData.customType}
                    onChange={(e) => setFormData(prev => ({ ...prev, customType: e.target.value }))}
                    placeholder="Specify custom type"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricePerUnit">Price per Unit (₹)</Label>
                  <Input
                    id="pricePerUnit"
                    type="number"
                    min="0"
                    value={formData.pricePerUnit}
                    onChange={(e) => setFormData(prev => ({ ...prev, pricePerUnit: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Product['status'] }))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Total Price</p>
              <div className="flex items-center gap-2">
                <IndianRupee className="w-6 h-6" />
                <p className="text-2xl font-bold">
                  {(formData.quantity * formData.pricePerUnit).toLocaleString('en-IN')}
                </p>
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
              <Button type="submit">
                Update Product
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {/* Product Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border flex items-center justify-center text-2xl">
                  {getProductIcon(product.type)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {getProductTypeLabel(product.type, product.customType)}
                  </h1>
                  <p className="text-muted-foreground mt-1 flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      {client?.companyName || 'Unknown Client'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(product.startDate), 'MMM d')} - {format(new Date(product.endDate), 'MMM d, yyyy')}
                    </span>
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <StatusBadge status={product.status} />
                    {isExpired && (
                      <Badge variant="outline" className="gap-1.5 text-red-600 border-red-200 bg-red-50">
                        <Clock className="w-3.5 h-3.5" />
                        Expired
                      </Badge>
                    )}
                    {!isExpired && (
                      <Badge variant="outline" className="gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Ends today'}
                      </Badge>
                    )}
                    <Badge variant="outline" className="gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {product.quantity} units
                    </Badge>
                    <Badge variant="outline" className="gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5" />
                      ₹{product.totalPrice.toLocaleString('en-IN')} total
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Product
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => copyToClipboard(product.id)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Product ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Product
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Value</p>
                  <p className="text-2xl font-bold">
                    ₹{product.totalPrice.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {product.quantity} units × ₹{product.pricePerUnit.toLocaleString('en-IN')} each
              </p>
            </CardContent> 
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Duration</p>
                  <p className="text-2xl font-bold text-green-600">
                    {totalDuration} days
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {format(new Date(product.startDate), 'MMM d, yyyy')} to {format(new Date(product.endDate), 'MMM d, yyyy')}
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Time Status</p>
                  <p className={`text-2xl font-bold ${isExpired ? 'text-red-600' : 'text-blue-600'}`}>
                    {isExpired ? 'Expired' : isActive ? 'Active' : 'Pending'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Product has ended'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>
              Complete information about this product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Product Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm font-medium text-muted-foreground">Product Type</Label>
                        <p className="font-medium">{getProductTypeLabel(product.type, product.customType)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50">
                      <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Tag className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm font-medium text-muted-foreground">Product ID</Label>
                        <p className="font-medium font-mono">{product.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(product.id)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Pricing Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Unit Price</Label>
                        <p className="font-medium">₹{product.pricePerUnit.toLocaleString('en-IN')}</p>
                      </div>
                      <IndianRupee className="w-5 h-5 text-muted-foreground" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Quantity</Label>
                        <p className="font-medium">{product.quantity} units</p>
                      </div>
                      <Users className="w-5 h-5 text-muted-foreground" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Total Value</Label>
                        <p className="text-lg font-bold text-primary">
                          ₹{product.totalPrice.toLocaleString('en-IN')}
                        </p>
                      </div>
                      <IndianRupee className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Client Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Building className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-sm font-medium text-muted-foreground">Client</Label>
                        <p className="font-medium">{client?.companyName || 'Unknown Client'}</p>
                        {client && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {client.contactPerson} • {client.phone}
                          </p>
                        )}
                      </div>
                      {client && (
                        <Link to={`/admin/clients/${client.id}`}>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                    
                    {client && (
                      <>
                        <div className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50">
                          <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <Label className="text-sm font-medium text-muted-foreground">Client Email</Label>
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
                        
                        <div className="p-3 border rounded-lg">
                          <Label className="text-sm font-medium text-muted-foreground">Client Address</Label>
                          <p className="font-medium mt-2 whitespace-pre-line">{client.address}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Dates</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Start Date</Label>
                        <p className="font-medium">
                          {format(new Date(product.startDate), 'MMMM d, yyyy')}
                        </p>
                      </div>
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">End Date</Label>
                        <p className="font-medium">
                          {format(new Date(product.endDate), 'MMMM d, yyyy')}
                        </p>
                      </div>
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Comments Section */}
            {product.comments && (
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">Additional Notes</h3>
                <div className="p-4 border rounded-lg bg-muted/20">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="whitespace-pre-line">{product.comments}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="border-t pt-6 flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => navigate('/admin/products')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Product
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Product
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}