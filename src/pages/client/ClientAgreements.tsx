import React, { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PageHeader from '@/components/dashboard/PageHeader';
import StatusBadge from '@/components/dashboard/StatusBadge';
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Search, 
  Filter,
  Building,
  User,
  Mail,
  Phone,
  Calendar,
  Eye,
  IndianRupee,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  BarChart3,
  Package,
  Users,
  TrendingUp,
  FileCheck,
  AlertCircle
} from 'lucide-react';
import { Agreement, AgreementStatus, ProductType, PRODUCT_TYPE_LABELS } from '@/types';
import { toast } from 'sonner';
import { format, differenceInDays, parseISO, isAfter, isBefore } from 'date-fns';

export default function ClientAgreements() {
  const { user } = useAuth();
  const { agreements: initialAgreements, clients: initialClients } = useData();
  
  const [agreements, setAgreements] = useState<Agreement[]>(initialAgreements);
  const [clients, setClients] = useState(initialClients);
  const [viewingAgreement, setViewingAgreement] = useState<Agreement | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

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
  };

  // Get current client based on logged-in user
  const currentClient = clients.find(c => c.companyName === user?.companyName);
  
  // Filter agreements for the current client only
  const clientAgreements = agreements.filter(agreement => agreement.clientId === currentClient?.id);

  // Filter agreements based on search and filters
  const filteredAgreements = clientAgreements.filter(agreement => {
    const matchesSearch = 
      agreement.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agreement.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agreement.products.some(p => 
        PRODUCT_TYPE_LABELS[p.type as ProductType]?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesStatus = filterStatus === 'all' || agreement.status === filterStatus;
    const matchesType = filterType === 'all' || 
      agreement.products.some(p => p.type === filterType);
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate statistics for current client
  const stats = {
    total: clientAgreements.length,
    active: clientAgreements.filter(a => {
      if (a.status !== 'approved') return false;
      const now = new Date();
      const start = parseISO(a.startDate);
      const end = parseISO(a.endDate);
      return isAfter(now, start) && isBefore(now, end);
    }).length,
    pending: clientAgreements.filter(a => a.status === 'pending').length,
    approved: clientAgreements.filter(a => a.status === 'approved').length,
    totalValue: clientAgreements.reduce((sum, a) => sum + a.totalValue, 0),
    activeValue: clientAgreements.filter(a => {
      if (a.status !== 'approved') return false;
      const now = new Date();
      const start = parseISO(a.startDate);
      const end = parseISO(a.endDate);
      return isAfter(now, start) && isBefore(now, end);
    }).reduce((sum, a) => sum + a.totalValue, 0),
  };

  const getStatusConfig = (status: AgreementStatus) => {
    const configs = {
      approved: {
        icon: CheckCircle,
        label: 'Approved',
        color: 'bg-green-500/10 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
        iconColor: 'text-green-600 dark:text-green-400'
      },
      pending: {
        icon: Clock,
        label: 'Pending',
        color: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
        iconColor: 'text-amber-600 dark:text-amber-400'
      },
      draft: {
        icon: FileText,
        label: 'Draft',
        color: 'bg-gray-500/10 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800',
        iconColor: 'text-gray-600 dark:text-gray-400'
      },
      rejected: {
        icon: XCircle,
        label: 'Rejected',
        color: 'bg-red-500/10 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
        iconColor: 'text-red-600 dark:text-red-400'
      }
    };
    return configs[status] || configs.draft;
  };

  const getDaysRemaining = (endDate: string, status: AgreementStatus) => {
    const end = parseISO(endDate);
    const days = differenceInDays(end, new Date());
    
    if (status === 'approved') {
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
    }
    
    // For non-approved agreements
    return {
      text: status.charAt(0).toUpperCase() + status.slice(1),
      variant: 'outline' as const,
      icon: status === 'pending' ? Clock : XCircle,
      iconColor: status === 'pending' ? 'text-amber-600' : 'text-red-600'
    };
  };

  const handleDownload = (agreement: Agreement) => {
    const client = currentClient;
    const content = `
WORKSPACE AGREEMENT
==================

Agreement ID: ${agreement.id}
Date: ${format(new Date(agreement.createdAt), 'MMMM d, yyyy')}
Status: ${agreement.status.toUpperCase()}

CLIENT INFORMATION
------------------
Company: ${client?.companyName || 'N/A'}
Contact: ${client?.contactPerson || 'N/A'}
Email: ${client?.email || 'N/A'}
Phone: ${client?.phone || 'N/A'}
Address: ${client?.address || 'N/A'}

AGREEMENT PERIOD
----------------
Start Date: ${format(parseISO(agreement.startDate), 'MMMM d, yyyy')}
End Date: ${format(parseISO(agreement.endDate), 'MMMM d, yyyy')}
Duration: ${differenceInDays(parseISO(agreement.endDate), parseISO(agreement.startDate))} days

PRODUCTS
--------
${agreement.products.map(p => 
  `- ${PRODUCT_TYPE_LABELS[p.type as ProductType] || p.type}: ${p.quantity} unit(s) @ ₹${p.pricePerUnit.toLocaleString('en-IN')}/unit = ₹${p.totalPrice.toLocaleString('en-IN')}`
).join('\n')}

Total Value: ₹${agreement.totalValue.toLocaleString('en-IN')}

TERMS AND CONDITIONS
--------------------
${agreement.termsAndConditions}

---
Generated on ${format(new Date(), 'MMMM d, yyyy')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agreement-${agreement.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Agreement downloaded successfully');
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
        title="My Agreements"
        description="View and manage your workspace agreements"
      />

      {/* Quick Stats - Same as Admin Side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Agreements</p>
                <p className="text-2xl font-bold">
                  {stats.total}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">{stats.active} currently active</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Active Value</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{stats.activeValue.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <IndianRupee className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Current active agreements</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Pending</p>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.pending}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Investment</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₹{stats.totalValue.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">All agreements</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters - Same as Admin Side */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search agreement ID, status, or products..."
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

      {/* Client Card - Same Design as Admin */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/5 border flex items-center justify-center">
                <Building className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-xl">{currentClient.companyName}</CardTitle>
                <CardDescription className="mt-1">
                  {currentClient.contactPerson} • {currentClient.email}
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="text-sm">
              {stats.total} agreement{stats.total !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Contact</p>
              <p className="font-medium flex items-center gap-1">
                <User className="w-4 h-4" />
                {currentClient.contactPerson}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-medium flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {currentClient.email}
              </p>
            </div>
            {currentClient.phone && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-medium flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {currentClient.phone}
                </p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="font-medium flex items-center gap-1">
                <Building className="w-4 h-4" />
                {currentClient.address}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agreements Cards Grid - Similar to Admin Side */}
      {filteredAgreements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No agreements found</h3>
            <p className="text-muted-foreground text-sm text-center">
              {searchQuery || filterStatus !== 'all' || filterType !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'No agreements have been created for your account yet.'}
            </p>
            {searchQuery && (
              <Button variant="outline" onClick={() => setSearchQuery('')}>
                Clear Search
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAgreements.map((agreement) => {
            const statusConfig = getStatusConfig(agreement.status);
            const StatusIcon = statusConfig.icon;
            const daysRemaining = getDaysRemaining(agreement.endDate, agreement.status);
            const DaysIcon = daysRemaining.icon;
            const duration = differenceInDays(parseISO(agreement.endDate), parseISO(agreement.startDate));
            
            return (
              <Card 
                key={agreement.id} 
                className="hover:shadow-lg transition-all duration-300 hover:border-blue-200 cursor-pointer group"
                onClick={() => setViewingAgreement(agreement)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-500" />
                        Agreement #{agreement.id.slice(-8)}
                      </CardTitle>
                      <CardDescription className="mt-2 space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Created {format(new Date(agreement.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{duration} days duration</span>
                        </div>
                      </CardDescription>
                    </div>
                    <Badge className={`gap-1.5 ${statusConfig.color}`}>
                      <StatusIcon className={`w-3 h-3 ${statusConfig.iconColor}`} />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Products Summary */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Products</span>
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{agreement.products.length} items</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Total Quantity</span>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">
                          {agreement.products.reduce((sum, p) => sum + p.quantity, 0)} units
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Period</span>
                      <span className="font-medium">
                        {format(parseISO(agreement.startDate), 'MMM d')} - {format(parseISO(agreement.endDate), 'MMM d')}
                      </span>
                    </div>
                  </div>

                  {/* Status and Days Remaining */}
                  <div className="flex items-center justify-between">
                    <Badge variant={daysRemaining.variant} className="gap-1.5">
                      <DaysIcon className="w-3 h-3" />
                      {daysRemaining.text}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <IndianRupee className="w-4 h-4 text-primary" />
                      <span className="font-bold text-lg">{agreement.totalValue.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* CTA Section */}
                  <div className="pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-blue-600 group-hover:gap-2 transition-all">
                        <span>View Details</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(agreement);
                        }}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* View Agreement Details Dialog */}
      <Dialog open={!!viewingAgreement} onOpenChange={() => setViewingAgreement(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agreement Details</DialogTitle>
            <DialogDescription>
              Complete agreement information and terms
            </DialogDescription>
          </DialogHeader>
          {viewingAgreement && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Agreement #{viewingAgreement.id.slice(-8)}</h3>
                  <p className="text-sm text-muted-foreground">
                    Created: {format(new Date(viewingAgreement.createdAt), 'PPP')}
                  </p>
                </div>
                <Badge className={`gap-1.5 ${getStatusConfig(viewingAgreement.status).color}`}>
                  {React.createElement(getStatusConfig(viewingAgreement.status).icon, {
                    className: `w-3.5 h-3.5 ${getStatusConfig(viewingAgreement.status).iconColor}`
                  })}
                  {getStatusConfig(viewingAgreement.status).label}
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
                        <p className="text-sm text-muted-foreground">Company</p>
                        <p className="font-medium">{currentClient.companyName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Contact Person</p>
                        <p className="font-medium">{currentClient.contactPerson}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {currentClient.email}
                        </p>
                      </div>
                      {currentClient.phone && (
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {currentClient.phone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Agreement Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Agreement Period
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Start Date</p>
                      <p className="font-medium">{format(parseISO(viewingAgreement.startDate), 'PPP')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">End Date</p>
                      <p className="font-medium">{format(parseISO(viewingAgreement.endDate), 'PPP')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-medium">
                        {differenceInDays(parseISO(viewingAgreement.endDate), parseISO(viewingAgreement.startDate))} days
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Products Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Products</p>
                      <p className="font-medium">{viewingAgreement.products.length} items</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Quantity</p>
                      <p className="font-medium flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {viewingAgreement.products.reduce((sum, p) => sum + p.quantity, 0)} units
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Financial Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <IndianRupee className="w-6 h-6 text-primary" />
                      <p className="text-2xl font-bold text-primary">
                        {viewingAgreement.totalValue.toLocaleString('en-IN')}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Total agreement value
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Products List */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Products & Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {viewingAgreement.products.map((product) => {
                      const productName = PRODUCT_TYPE_LABELS[product.type as ProductType] || product.type;
                      
                      return (
                        <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium capitalize">{productName}</p>
                            {product.comments && (
                              <p className="text-xs text-muted-foreground mt-1">{product.comments}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {product.quantity} x ₹{product.pricePerUnit.toLocaleString('en-IN')}
                            </p>
                            <p className="text-sm font-bold">
                              ₹{product.totalPrice.toLocaleString('en-IN')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Terms and Conditions */}
              {viewingAgreement.termsAndConditions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileCheck className="w-5 h-5" />
                      Terms & Conditions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/30 p-4 rounded-lg max-h-60 overflow-y-auto">
                      <p className="text-sm whitespace-pre-wrap">{viewingAgreement.termsAndConditions}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Footer Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button variant="outline" onClick={() => setViewingAgreement(null)}>
                  Close
                </Button>
                <Button onClick={() => handleDownload(viewingAgreement)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Agreement
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}