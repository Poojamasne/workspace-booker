import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useNavigate } from 'react-router-dom'; // ADD THIS IMPORT
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import StatusBadge from '@/components/dashboard/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Plus, Package, Edit, Trash2, Calendar, Users, IndianRupee, Search, Filter, Eye } from 'lucide-react'; // ADDED Eye icon
import { ProductType, PRODUCT_TYPE_LABELS, Product } from '@/types';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

export default function AdminProducts() {
  const { products, clients, addProduct, updateProduct, deleteProduct } = useData();
  const navigate = useNavigate(); // ADD THIS LINE

  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
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

  const filteredProducts = products.filter(product => {
    const client = clients.find(c => c.id === product.clientId);
    const matchesSearch = 
      PRODUCT_TYPE_LABELS[product.type].toLowerCase().includes(searchQuery.toLowerCase()) ||
      client?.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.type === 'others' && product.customType?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    const matchesClient = filterClient === 'all' || product.clientId === filterClient;
    return matchesSearch && matchesStatus && matchesClient;
  });

  const defaultPrices: Record<ProductType, number> = {
    private_cabin: 15000,
    work_desk: 3500,
    floating_seat: 2000,
    conference_room: 2000,
    meeting_room: 1500,
    others: 0,
  };

  const handleTypeChange = (type: ProductType) => {
    setFormData(prev => ({
      ...prev,
      type,
      pricePerUnit: defaultPrices[type],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalPrice = formData.quantity * formData.pricePerUnit;
    
    if (editingProduct) {
      updateProduct(editingProduct.id, {
        ...formData,
        totalPrice,
      });
      toast.success('Product updated successfully');
    } else {
      addProduct({
        ...formData,
        totalPrice,
      });
      toast.success('Product created successfully');
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      type: 'private_cabin',
      customType: '',
      quantity: 1,
      startDate: '',
      endDate: '',
      pricePerUnit: 0,
      comments: '',
      clientId: '',
      status: 'pending',
    });
    setEditingProduct(null);
    setIsOpen(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      type: product.type,
      customType: product.customType || '',
      quantity: product.quantity,
      startDate: product.startDate,
      endDate: product.endDate,
      pricePerUnit: product.pricePerUnit,
      comments: product.comments || '',
      clientId: product.clientId,
      status: product.status,
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
      toast.success('Product deleted successfully');
    }
  };

  // Get days remaining
  const getDaysRemaining = (endDate: string) => {
    const days = differenceInDays(new Date(endDate), new Date());
    return days > 0 ? `${days} days remaining` : 'Expired';
  };

  // Get product icon
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

  // Calculate summary statistics
  const activeProducts = products.filter(p => p.status === 'active');
  const pendingProducts = products.filter(p => p.status === 'pending');
  const totalRevenue = products.reduce((sum, p) => sum + p.totalPrice, 0);
  const activeRevenue = activeProducts.reduce((sum, p) => sum + p.totalPrice, 0);

  return (
    <DashboardLayout role="admin">
      <PageHeader 
        title="Product Management"
        description="Manage workspace products and availability"
        actions={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            {/* FIXED: Added responsive max-height and overflow-auto */}
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </DialogTitle>
                <DialogDescription>
                  Configure product details and pricing
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select
                    value={formData.clientId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, clientId: value }))}
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

                <div className="space-y-2">
                  <Label>Product Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleTypeChange(value as ProductType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === 'others' && (
                  <div className="space-y-2">
                    <Label>Custom Type</Label>
                    <Input
                      value={formData.customType}
                      onChange={(e) => setFormData(prev => ({ ...prev, customType: e.target.value }))}
                      placeholder="Specify custom type"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price per Unit</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        value={formData.pricePerUnit}
                        onChange={(e) => setFormData(prev => ({ ...prev, pricePerUnit: parseFloat(e.target.value) || 0 }))}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as Product['status'] }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Comments</Label>
                  <Textarea
                    value={formData.comments}
                    onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                    placeholder="Additional notes..."
                    rows={2}
                  />
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

                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingProduct ? 'Update Product' : 'Add Product'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products, clients, or custom types..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
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

      {/* Products List - Card Layout */}
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No products found</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery || filterStatus !== 'all' || filterClient !== 'all' ? 'Try different filters' : 'Add your first product'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => {
              const client = clients.find(c => c.id === product.clientId);
              return (
                <Card key={product.id} className="hover:shadow-lg transition-shadow duration-300 group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {getProductIcon(product.type)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {product.type === 'others' ? product.customType : PRODUCT_TYPE_LABELS[product.type]}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {client?.companyName || 'Unknown Client'}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={product.status} />
                      <span className="text-xs text-muted-foreground">
                        {getDaysRemaining(product.endDate)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-medium">
                          {format(new Date(product.startDate), 'MMM d')} - {format(new Date(product.endDate), 'MMM d')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Value</span>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="w-4 h-4" />
                          <span className="font-bold text-lg">{product.totalPrice.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {product.comments && (
                      <div className="pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm line-clamp-2">{product.comments}</p>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-0 flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => navigate(`/admin/products/${product.id}`)} // CHANGED: Navigate to product details page
                    >
                      <Eye className="w-4 h-4 mr-2" /> {/* ADDED: Eye icon */}
                      Details
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="flex-1"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button 
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}