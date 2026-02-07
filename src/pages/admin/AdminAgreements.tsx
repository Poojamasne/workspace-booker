import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Users, 
  Search, 
  Filter,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  IndianRupee,
  Calendar,
  Eye,
  ChevronRight
} from 'lucide-react';
import { Agreement, AgreementStatus, Client } from '@/types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function AdminAgreements() {
  const { agreements: initialAgreements, clients: initialClients } = useData();
  const navigate = useNavigate();

  const [agreements, setAgreements] = useState<Agreement[]>(initialAgreements);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Load data from localStorage on component mount
  useEffect(() => {
    const loadDataFromLocalStorage = () => {
      try {
        const storedAgreements = localStorage.getItem('agreements');
        const storedClients = localStorage.getItem('clients');

        if (storedAgreements) {
          const parsedAgreements = JSON.parse(storedAgreements);
          setAgreements(parsedAgreements);
        }

        if (storedClients) {
          const parsedClients = JSON.parse(storedClients);
          setClients(parsedClients);
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
    if (e.key === 'agreements') {
      try {
        const parsedAgreements = JSON.parse(e.newValue || '[]');
        setAgreements(parsedAgreements);
      } catch (error) {
        console.error('Error parsing agreements from storage:', error);
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
  };

  // Group agreements by client
  const clientAgreements = clients.map(client => {
    const clientAgreements = agreements.filter(agreement => agreement.clientId === client.id);
    const approvedAgreements = clientAgreements.filter(a => a.status === 'approved');
    const pendingAgreements = clientAgreements.filter(a => a.status === 'pending');
    
    return {
      client,
      agreements: clientAgreements,
      totalAgreements: clientAgreements.length,
      totalValue: clientAgreements.reduce((sum, a) => sum + a.totalValue, 0),
      pendingAgreements: pendingAgreements.length,
      approvedAgreements: approvedAgreements.length,
      latestAgreement: clientAgreements.length > 0 
        ? clientAgreements[clientAgreements.length - 1] 
        : null,
    };
  }).filter(clientGroup => clientGroup.agreements.length > 0);

  // Filter client agreements
  const filteredClientAgreements = clientAgreements.filter(clientGroup => {
    const client = clientGroup.client;
    const matchesSearch = client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterClient !== 'all' && client.id !== filterClient) return false;
    
    if (filterStatus === 'all') return matchesSearch;
    
    return matchesSearch && clientGroup.agreements.some(a => a.status === filterStatus);
  });

  const handleViewClientDetails = (clientId: string) => {
    navigate(`/admin/agreements/${clientId}`);
  };

  const handleDeleteClient = () => {
    if (!clientToDelete) return;

    try {
      // Remove client's agreements
      const updatedAgreements = agreements.filter(a => a.clientId !== clientToDelete.id);
      setAgreements(updatedAgreements);
      localStorage.setItem('agreements', JSON.stringify(updatedAgreements));

      // Remove client
      const updatedClients = clients.filter(c => c.id !== clientToDelete.id);
      setClients(updatedClients);
      localStorage.setItem('clients', JSON.stringify(updatedClients));

      toast.success('Client and their agreements deleted successfully');
    } catch (error) {
      toast.error('Failed to delete client');
      console.error('Error deleting client:', error);
    } finally {
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };

  // Calculate statistics for the header
  const totalClients = clientAgreements.length;
  const totalAgreements = agreements.length;
  const totalValue = agreements.reduce((sum, a) => sum + a.totalValue, 0);
  const pendingAgreements = agreements.filter(a => a.status === 'pending').length;

  return (
    <DashboardLayout role="admin">
      <PageHeader 
        title="Agreement Management"
        description="Manage client agreements and view client details"
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete {clientToDelete?.companyName}? 
              This will also delete all associated agreements and cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteClient}>
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
            placeholder="Search clients, contacts, or emails..."
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
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
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
      {filteredClientAgreements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No clients found</h3>
            <p className="text-muted-foreground text-sm text-center">
              {searchQuery || filterStatus !== 'all' || filterClient !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Clients with agreements will appear here'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClientAgreements.map(({ client, totalAgreements, totalValue, pendingAgreements, approvedAgreements, latestAgreement }) => (
            <Card 
              key={client.id} 
              className="hover:shadow-lg transition-all duration-300 hover:border-blue-200 cursor-pointer group"
              onClick={() => handleViewClientDetails(client.id)}
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
                      {client.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span className="text-sm">{client.phone}</span>
                        </div>
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {totalAgreements} {totalAgreements === 1 ? 'agreement' : 'agreements'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
               
                {/* CTA Section */}
                <div className="pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-blue-600 group-hover:gap-2 transition-all">
                      <span>View Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}