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
import { Badge } from "@/components/ui/badge";
import { Package, Search, Filter, Calendar, Users, IndianRupee, Clock, Building2, CheckCircle, XCircle, Plus, Edit, Trash2, MoreVertical, Eye, Copy, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductType, PRODUCT_TYPE_LABELS, Product } from '@/types';
import { format, differenceInDays, isAfter, isBefore, parseISO } from 'date-fns';
import { toast } from 'sonner';

export default function ClientProducts() {
  const { user } = useAuth();
  const { products, clients, addProduct, updateProduct, deleteProduct } = useData();
  
  // Get current client based on logged-in user
  const currentClient = clients.find(c => c.companyName === user?.companyName);
  
  // Filter products for the current client only
  const clientProducts = products.filter(product => product.clientId === currentClient?.id);
  
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Product;
    direction: 'asc' | 'desc';
  }>({ key: 'createdAt', direction: 'desc' });
  
  const [formData, setFormData] = useState({
    type: 'private_cabin' as ProductType,
    customType: '',
    quantity: 1,
    startDate: '',
    endDate: '',
    pricePerUnit: 0,
    comments: '',
    clientId: currentClient?.id || '',
    status: 'pending' as Product['status'],
  });

  // Default prices for different product types
  const defaultPrices: Record<ProductType, number> = {
    private_cabin: 15000,
    work_desk: 3500,
    floating_seat: 2000,
    conference_room: 2000,
    meeting_room: 1500,
    others: 0,
  };

  // Handle product type change
  const handleTypeChange = (type: ProductType) => {
    setFormData(prev => ({
      ...prev,
      type,
      pricePerUnit: defaultPrices[type],
    }));
  };

  // Handle form submission
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
      if (!currentClient) {
        toast.error('Client information not found');
        return;
      }
      
      addProduct({
        ...formData,
        clientId: currentClient.id,
        totalPrice,
      });
      toast.success('Product added successfully');
    }
    
    resetForm();
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      type: 'private_cabin',
      customType: '',
      quantity: 1,
      startDate: '',
      endDate: '',
      pricePerUnit: 0,
      comments: '',
      clientId: currentClient?.id || '',
      status: 'pending',
    });
    setEditingProduct(null);
    setIsOpen(false);
  };

  // Handle edit product
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

  // Handle delete product
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
      toast.success('Product deleted successfully');
    }
  };

  // Get days remaining with status indicator - UPDATED FOR ALL STATUSES
  const getDaysRemaining = (endDate: string, status: Product['status']) => {
    const end = parseISO(endDate);
    const days = differenceInDays(end, new Date());
    
    // For completed or cancelled products, show status label
    if (status === 'completed' || status === 'cancelled') {
      return {
        text: status.charAt(0).toUpperCase() + status.slice(1),
        variant: 'outline' as const,
        icon: status === 'completed' ? CheckCircle : XCircle,
        iconColor: status === 'completed' ? 'text-green-600' : 'text-red-600'
      };
    }
    
    // For pending products, show days remaining with different styling
    if (status === 'pending') {
      if (days > 0) {
        return {
          text: `${days} days`,
          variant: 'outline' as const,
          icon: Clock,
          iconColor: 'text-amber-600'
        };
      } else if (days === 0) {
        return {
          text: 'Starts today',
          variant: 'outline' as const,
          icon: Clock,
          iconColor: 'text-blue-600'
        };
      } else {
        return {
          text: 'Overdue',
          variant: 'destructive' as const,
          icon: XCircle,
          iconColor: 'text-red-600'
        };
      }
    }
    
    // For active products
    if (days > 0) {
      return {
        text: `${days} days`,
        variant: 'default' as const,
        icon: Clock,
        iconColor: 'text-blue-600'
      };
    } else if (days === 0) {
      return {
        text: 'Ends today',
        variant: 'outline' as const,
        icon: Clock,
        iconColor: 'text-amber-600'
      };
    } else {
      return {
        text: 'Expired',
        variant: 'destructive' as const,
        icon: XCircle,
        iconColor: 'text-red-600'
      };
    }
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

  // Handle sort
  const handleSort = (key: keyof Product) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filter products based on search and filters
  const filteredProducts = clientProducts.filter(product => {
    const matchesSearch = 
      PRODUCT_TYPE_LABELS[product.type].toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.type === 'others' && product.customType?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    const matchesType = filterType === 'all' || product.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Sort filtered products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (sortConfig.key === 'totalPrice' || sortConfig.key === 'pricePerUnit') {
      return sortConfig.direction === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    }
    
    if (sortConfig.key === 'startDate' || sortConfig.key === 'endDate' || sortConfig.key === 'createdAt') {
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
    total: clientProducts.length,
    active: clientProducts.filter(p => p.status === 'active').length,
    pending: clientProducts.filter(p => p.status === 'pending').length,
    completed: clientProducts.filter(p => p.status === 'completed').length,
    totalValue: clientProducts.reduce((sum, p) => sum + p.totalPrice, 0),
    activeValue: clientProducts.filter(p => p.status === 'active').reduce((sum, p) => sum + p.totalPrice, 0),
  };

  // Get current active products
  const getCurrentActiveProducts = () => {
    const now = new Date();
    return clientProducts.filter(product => {
      if (product.status !== 'active') return false;
      const start = parseISO(product.startDate);
      const end = parseISO(product.endDate);
      return isAfter(now, start) && isBefore(now, end);
    });
  };

  const currentActiveProducts = getCurrentActiveProducts();

  // Copy product ID to clipboard
  const copyProductId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success('Product ID copied to clipboard');
  };

  if (!currentClient) {
    return (
      <DashboardLayout role="client">
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
          <div className="text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-8 h-8 text-muted-foreground" />
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
        title="Products"
        description="Manage your workspace products and services"
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="h-8 px-3"
              >
                Table
              </Button>
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
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
                    <div className="p-3 bg-muted/20 rounded-lg">
                      <p className="font-medium">{currentClient.companyName}</p>
                      <p className="text-xs text-muted-foreground">{currentClient.contactPerson} • {currentClient.email}</p>
                    </div>
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
          </div>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search products or custom types..."
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
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table View */}
      {viewMode === 'table' ? (
        <Card>
          <CardHeader>
            <CardTitle>All Products</CardTitle>
            <CardDescription>
              {sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No products found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || filterStatus !== 'all' || filterType !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'No products have been assigned to your account yet.'}
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
                          Type
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={() => handleSort('type')}
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
                          Quantity
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={() => handleSort('quantity')}
                          >
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableHead>
                      <TableHead>
                        <div className="flex items-center gap-1">
                          Period
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={() => handleSort('startDate')}
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
                          Value
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={() => handleSort('totalPrice')}
                          >
                            <ArrowUpDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedProducts.map((product) => {
                      const daysRemaining = getDaysRemaining(product.endDate, product.status);
                      const DaysIcon = daysRemaining.icon;
                      
                      return (
                        <TableRow key={product.id} className="hover:bg-muted/50 group">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <div className="text-xl">
                                {getProductIcon(product.type)}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {product.type === 'others' ? product.customType : PRODUCT_TYPE_LABELS[product.type]}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ID: {product.id.slice(0, 8)}...
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={product.status} />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{product.quantity}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm">
                                  {format(parseISO(product.startDate), 'MMM d, yyyy')}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm">
                                  {format(parseISO(product.endDate), 'MMM d, yyyy')}
                                </span>
                              </div>
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
                                <span className="font-bold text-lg">{product.totalPrice.toLocaleString('en-IN')}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                ₹{product.pricePerUnit.toLocaleString('en-IN')}/unit
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
                                <DropdownMenuItem onClick={() => setViewingProduct(product)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(product)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => copyProductId(product.id)}>
                                  <Copy className="w-4 h-4 mr-2" />
                                  Copy ID
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDelete(product.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
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
          {sortedProducts.length > 0 && (
            <CardFooter className="border-t px-6 py-4">
              <div className="w-full flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Showing {sortedProducts.length} of {clientProducts.length} products
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
      ) : (
        /* Grid View */
        <div className="space-y-6">
          {/* Currently Active Products */}
          {currentActiveProducts.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Currently Active Products
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentActiveProducts.map(product => {
                  const daysRemaining = getDaysRemaining(product.endDate, product.status);
                  const DaysIcon = daysRemaining.icon;
                  return (
                    <Card key={product.id} className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow duration-300">
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
                                Active Now
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <StatusBadge status={product.status} />
                          <span className={`text-xs font-medium flex items-center gap-1 ${daysRemaining.iconColor}`}>
                            <DaysIcon className="w-3.5 h-3.5" />
                            {daysRemaining.text}
                          </span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Period</span>
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
                      </CardContent>

                      <CardFooter className="pt-0 flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setViewingProduct(product)}
                        >
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

          {/* All Products Grid */}
          <div>
            <h3 className="text-lg font-semibold mb-4">All Products</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedProducts.map(product => {
                const daysRemaining = getDaysRemaining(product.endDate, product.status);
                const DaysIcon = daysRemaining.icon;

                return (
                  <Card key={product.id} className={`hover:shadow-lg transition-shadow duration-300 group ${
                    product.status === 'active' ? 'border-l-4 border-l-green-500' :
                    product.status === 'pending' ? 'border-l-4 border-l-amber-500' :
                    product.status === 'completed' ? 'border-l-4 border-l-blue-500' : ''
                  }`}>
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
                              {product.status}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <StatusBadge status={product.status} />
                        <span className={`text-xs font-medium flex items-center gap-1 ${daysRemaining.iconColor}`}>
                          <DaysIcon className="w-3.5 h-3.5" />
                          {daysRemaining.text}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Period</span>
                          <span className="font-medium">
                            {format(new Date(product.startDate), 'MMM d')} - {format(new Date(product.endDate), 'MMM d')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Quantity</span>
                          <span className="font-medium flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {product.quantity} units
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
                    </CardContent>

                    <CardFooter className="pt-0 flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setViewingProduct(product)}
                      >
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
        </div>
      )}

      {/* View Product Details Dialog */}
      <Dialog open={!!viewingProduct} onOpenChange={() => setViewingProduct(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {viewingProduct && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">
                    {getProductIcon(viewingProduct.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {viewingProduct.type === 'others' ? viewingProduct.customType : PRODUCT_TYPE_LABELS[viewingProduct.type]}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Product ID: {viewingProduct.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                </div>
                <StatusBadge status={viewingProduct.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="font-medium">
                    {currentClient.companyName}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p className="font-medium flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {viewingProduct.quantity} units
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Unit Price</p>
                  <p className="font-medium flex items-center gap-1">
                    <IndianRupee className="w-4 h-4" />
                    {viewingProduct.pricePerUnit.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Total Value</p>
                  <p className="font-medium flex items-center gap-1">
                    <IndianRupee className="w-4 h-4" />
                    {viewingProduct.totalPrice.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Start Date</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(viewingProduct.startDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">End Date</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(viewingProduct.endDate), 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-medium">
                  {differenceInDays(new Date(viewingProduct.endDate), new Date(viewingProduct.startDate))} days
                </p>
              </div>

              {viewingProduct.comments && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-lg">
                    {viewingProduct.comments}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewingProduct(null);
                    handleEdit(viewingProduct);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button onClick={() => {
                  setViewingProduct(null);
                  handleDelete(viewingProduct.id);
                }} variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}