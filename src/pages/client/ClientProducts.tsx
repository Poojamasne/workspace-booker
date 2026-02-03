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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Package, Trash2, Edit } from 'lucide-react';
import { ProductType, PRODUCT_TYPE_LABELS, Product } from '@/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ClientProducts() {
  const { user } = useAuth();
  const { clients, getProductsByClient, addProduct, updateProduct, deleteProduct } = useData();
  
  const client = clients.find(c => c.companyName === user?.companyName);
  const clientId = client?.id || 'client-1';
  
  const products = getProductsByClient(clientId);

  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    type: 'private_cabin' as ProductType,
    customType: '',
    quantity: 1,
    startDate: '',
    endDate: '',
    pricePerUnit: 0,
    comments: '',
  });

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
        clientId,
        status: 'pending',
      });
      toast.success('Product booking created successfully');
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
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
      toast.success('Product deleted successfully');
    }
  };

  // Default prices for product types
  const defaultPrices: Record<ProductType, number> = {
    private_cabin: 1500,
    work_desk: 350,
    floating_seat: 200,
    conference_room: 200,
    meeting_room: 150,
    others: 0,
  };

  const handleTypeChange = (type: ProductType) => {
    setFormData(prev => ({
      ...prev,
      type,
      pricePerUnit: defaultPrices[type],
    }));
  };

  return (
    <DashboardLayout role="client">
      <PageHeader 
        title="Product Bookings"
        description="Manage your workspace product bookings"
        actions={
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="w-4 h-4 mr-2" />
                New Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? 'Edit Product Booking' : 'Create Product Booking'}
                </DialogTitle>
                <DialogDescription>
                  Fill in the details for your workspace booking
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    <Label>Quantity / Seats</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price per Unit ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.pricePerUnit}
                      onChange={(e) => setFormData(prev => ({ ...prev, pricePerUnit: parseFloat(e.target.value) || 0 }))}
                    />
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
                  <Label>Comments / Notes</Label>
                  <Textarea
                    value={formData.comments}
                    onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                    placeholder="Any specific requirements? E.g., 'Need window-side cabin' or 'AC required'"
                    rows={3}
                  />
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Estimated Total</p>
                  <p className="text-2xl font-bold">
                    ${(formData.quantity * formData.pricePerUnit).toLocaleString()}
                  </p>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingProduct ? 'Update Booking' : 'Create Booking'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Products List */}
      {products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create your first workspace booking to get started
            </p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Booking
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Product</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Quantity</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Duration</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Price</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-sm">
                            {product.type === 'others' ? product.customType : PRODUCT_TYPE_LABELS[product.type]}
                          </p>
                          {product.comments && (
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {product.comments}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{product.quantity}</td>
                      <td className="py-3 px-4 text-sm">
                        {format(new Date(product.startDate), 'MMM d')} - {format(new Date(product.endDate), 'MMM d, yyyy')}
                      </td>
                      <td className="py-3 px-4 font-medium text-sm">${product.totalPrice.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={product.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
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
