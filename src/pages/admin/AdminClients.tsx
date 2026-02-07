import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  Users, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  User, 
  Search, 
  MoreVertical, 
  Calendar,
  Eye,
  Building,
  CheckCircle,
  Clock,
  XCircle,
  Sparkles,
  FileText,
  FileCheck,
  Package,
  IndianRupee
} from 'lucide-react';
import { Client } from '@/types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function AdminClients() {
  const { clients, addClient, updateClient, deleteClient, products, agreements } = useData();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    companyName: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
  });

  const filteredClients = clients.filter(client =>
    client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getClientStatus = (clientId: string) => {
    const clientProducts = products.filter(p => p.clientId === clientId);
    const clientAgreements = agreements.filter(a => a.clientId === clientId);
    const activeProducts = clientProducts.filter(p => p.status === 'active');
    const pendingAgreements = clientAgreements.filter(a => a.status === 'pending');
    const activeAgreements = clientAgreements.filter(a => a.status === 'approved');
    
    if (activeAgreements.length > 0 && activeProducts.length > 0) return 'active';
    if (pendingAgreements.length > 0) return 'pending';
    if (clientProducts.length === 0 && clientAgreements.length === 0) return 'new';
    return 'inactive';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      new: 'bg-blue-100 text-blue-700 border-blue-200',
      inactive: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[status as keyof typeof colors] || colors.inactive;
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      active: CheckCircle,
      pending: Clock,
      new: Sparkles,
      inactive: XCircle
    };
    return icons[status as keyof typeof icons] || XCircle;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingClient) {
      updateClient(editingClient.id, formData);
      toast.success('Client updated successfully');
    } else {
      addClient(formData);
      toast.success('Client created successfully');
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      companyName: '',
      email: '',
      phone: '',
      address: '',
      contactPerson: '',
    });
    setEditingClient(null);
    setIsOpen(false);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      companyName: client.companyName,
      email: client.email,
      phone: client.phone,
      address: client.address,
      contactPerson: client.contactPerson,
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteClient(id);
      toast.success('Client deleted successfully');
    }
  };

  const handleViewDetails = (client: Client) => {
    navigate(`/admin/clients/${client.id}`);
  };

  return (
    <DashboardLayout role="admin">
      <PageHeader 
        title="Clients Management"
        description="Manage all client accounts"
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingClient ? 'Edit Client' : 'Add New Client'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingClient ? 'Update client information' : 'Enter the client details below'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      placeholder="Acme Corporation"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contact Person</Label>
                      <Input
                        value={formData.contactPerson}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+91 1234567890"
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
                      placeholder="contact@company.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Company Address</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="123 Business St, City, State 12345"
                      required
                    />
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingClient ? 'Update Client' : 'Add Client'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {filteredClients.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="w-16 h-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? 'No clients found' : 'No clients yet'}
            </h3>
            <p className="text-muted-foreground text-center text-sm mb-4">
              {searchQuery ? 'Try a different search term' : 'Add your first client to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Client
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredClients.map(client => {
            const status = getClientStatus(client.id);
            const StatusIcon = getStatusIcon(status);
            const statusColor = getStatusColor(status);
            
            return (
              <Card key={client.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base truncate max-w-[150px]">
                          {client.companyName}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate max-w-[150px] flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {client.contactPerson}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => handleEdit(client)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Client
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewDetails(client)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => navigate(`/admin/agreements/${client.id}`)}
                        >
                          <FileCheck className="w-4 h-4 mr-2" />
                          View Agreements
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => navigate(`/admin/invoices/${client.id}`)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          View Invoices
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(client.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={cn("gap-1.5 px-2 py-1 text-xs", statusColor)}>
                        <StatusIcon className="w-3 h-3" />
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(client.createdAt), 'MMM yyyy')}
                      </div>
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