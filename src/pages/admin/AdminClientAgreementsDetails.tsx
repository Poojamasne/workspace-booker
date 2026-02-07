import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  FileBarChart,
  Shield,
  Target
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
import { Agreement, AgreementStatus, PRODUCT_TYPE_LABELS, Client } from '@/types';
import { format, differenceInDays, isAfter, isBefore, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminClientAgreementsDetails() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const { agreements: initialAgreements, clients: initialClients, updateAgreement } = useData();

  const [agreements, setAgreements] = useState<Agreement[]>(initialAgreements);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null); // Added state for selected agreement

  const client = clients.find(c => c.id === clientId);
  const clientAgreements = agreements.filter(a => a.clientId === clientId);

  // Filter agreements based on active tab and search
  const filteredAgreements = clientAgreements.filter(agreement => {
    // Apply tab filter
    if (activeTab !== 'all') {
      if (activeTab === 'pending') return agreement.status === 'pending';
      if (activeTab === 'approved') return agreement.status === 'approved';
      if (activeTab === 'draft') return agreement.status === 'draft';
      if (activeTab === 'rejected') return agreement.status === 'rejected';
      if (activeTab === 'active') {
        if (agreement.status !== 'approved') return false;
        const now = new Date();
        const start = parseISO(agreement.startDate);
        const end = parseISO(agreement.endDate);
        return isAfter(now, start) && isBefore(now, end);
      }
      if (activeTab === 'expired') {
        if (agreement.status !== 'approved') return false;
        return isAfter(new Date(), parseISO(agreement.endDate));
      }
      if (activeTab === 'upcoming') {
        if (agreement.status !== 'approved') return false;
        return isBefore(new Date(), parseISO(agreement.startDate));
      }
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const statusMatch = agreement.status.toLowerCase().includes(query);
      const productMatch = agreement.products.some(p => 
        PRODUCT_TYPE_LABELS[p.type].toLowerCase().includes(query)
      );
      const idMatch = agreement.id.toLowerCase().includes(query);
      const valueMatch = agreement.totalValue.toString().includes(query);
      
      return statusMatch || productMatch || idMatch || valueMatch;
    }

    return true;
  });

  // Sort agreements
  const sortedAgreements = [...filteredAgreements].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'date-asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'value-desc':
        return b.totalValue - a.totalValue;
      case 'value-asc':
        return a.totalValue - b.totalValue;
      case 'duration-desc':
        return differenceInDays(parseISO(b.endDate), parseISO(b.startDate)) - 
               differenceInDays(parseISO(a.endDate), parseISO(a.startDate));
      case 'duration-asc':
        return differenceInDays(parseISO(a.endDate), parseISO(a.startDate)) - 
               differenceInDays(parseISO(b.endDate), parseISO(b.startDate));
      default:
        return 0;
    }
  });

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
      } finally {
        setIsLoading(false);
      }
    };

    loadDataFromLocalStorage();
  }, []);

  // Calculate statistics
  const stats = {
    totalValue: clientAgreements.reduce((sum, a) => sum + a.totalValue, 0),
    pending: clientAgreements.filter(a => a.status === 'pending').length,
    approved: clientAgreements.filter(a => a.status === 'approved').length,
    active: clientAgreements.filter(a => {
      if (a.status !== 'approved') return false;
      const now = new Date();
      const start = parseISO(a.startDate);
      const end = parseISO(a.endDate);
      return isAfter(now, start) && isBefore(now, end);
    }).length,
    expired: clientAgreements.filter(a => {
      if (a.status !== 'approved') return false;
      return isAfter(new Date(), parseISO(a.endDate));
    }).length,
    total: clientAgreements.length,
    averageValue: clientAgreements.length > 0 ? 
      clientAgreements.reduce((sum, a) => sum + a.totalValue, 0) / clientAgreements.length : 0
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
        icon: AlertCircle,
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
        icon: X,
        label: 'Rejected',
        color: 'bg-red-500/10 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
        iconColor: 'text-red-600 dark:text-red-400'
      }
    };
    return configs[status] || configs.draft;
  };

  const getDaysRemaining = (endDate: string) => {
    const end = parseISO(endDate);
    const days = differenceInDays(end, new Date());
    
    if (days > 90) return { text: `${Math.floor(days/30)} months`, variant: 'default' as const };
    if (days > 30) return { text: `${Math.floor(days/30)} month${Math.floor(days/30) > 1 ? 's' : ''}`, variant: 'default' as const };
    if (days > 7) return { text: `${days} days`, variant: 'default' as const };
    if (days > 0) return { text: `${days} days`, variant: 'secondary' as const };
    if (days === 0) return { text: 'Ends today', variant: 'outline' as const };
    return { text: 'Expired', variant: 'destructive' as const };
  };

  const handleStatusChange = async (id: string, status: AgreementStatus) => {
    setIsLoading(true);
    try {
      const updatedAgreement = agreements.find(a => a.id === id);
      if (updatedAgreement) {
        const updated = {
          ...updatedAgreement,
          status,
          updatedAt: new Date().toISOString(),
        };

        const updatedAgreements = agreements.map(a => a.id === id ? updated : a);
        setAgreements(updatedAgreements);
        localStorage.setItem('agreements', JSON.stringify(updatedAgreements));
        updateAgreement(id, { status });

        toast.success(`Agreement ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
      }
    } catch (error) {
      toast.error('Failed to update agreement status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (agreement: Agreement) => {
    const client = clients.find(c => c.id === agreement.clientId);
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
  `- ${PRODUCT_TYPE_LABELS[p.type]}: ${p.quantity} unit(s) @ ₹${p.pricePerUnit.toLocaleString('en-IN')}/unit = ₹${p.totalPrice.toLocaleString('en-IN')}`
).join('\n')}

Total Value: ${agreement.totalValue.toLocaleString('en-IN')}

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
            <Button onClick={() => navigate('/admin/agreements')}>
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
              onClick={() => navigate('/admin/agreements')}
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
              <Button variant="outline" onClick={() => navigate('/admin/agreements')}>
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
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Value</p>
                  <p className="text-2xl font-bold">
                    ₹{stats.totalValue.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <IndianRupee className="w-5 h-5 text-primary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{stats.total} agreements</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Active</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.active}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">{stats.approved} approved total</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Pending</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {stats.pending}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Awaiting review</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Avg. Value</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    ₹{Math.round(stats.averageValue).toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Per agreement</p>
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
                    placeholder="Search agreements..."
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
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="draft">Draft</TabsTrigger>
                  <TabsTrigger value="expired">Expired</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Agreements List */}
        <Card>
          <CardHeader>
            <CardTitle>Agreements</CardTitle>
            <CardDescription>
              {sortedAgreements.length} agreement{sortedAgreements.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted/30 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : sortedAgreements.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No agreements found</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  {searchQuery
                    ? 'No agreements match your search criteria'
                    : activeTab === 'all'
                    ? 'This client has no agreements yet.'
                    : `No ${activeTab} agreements found.`}
                </p>
                {searchQuery && (
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedAgreements.map((agreement) => {
                  const statusConfig = getStatusConfig(agreement.status);
                  const StatusIcon = statusConfig.icon;
                  const daysRemaining = agreement.status === 'approved' ? getDaysRemaining(agreement.endDate) : null;
                  const duration = differenceInDays(parseISO(agreement.endDate), parseISO(agreement.startDate));

                  return (
                    <Card key={agreement.id} className="overflow-hidden hover:shadow-md transition-all duration-200 border hover:border-primary/30">
                      <CardContent className="p-0">
                        <div className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                            {/* Left Column - Basic Info */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-4">
                                <div>
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-lg">
                                      Agreement #{agreement.id.slice(-8)}
                                    </h3>
                                    <Badge className={cn("gap-1.5", statusConfig.color)}>
                                      <StatusIcon className={cn("w-3.5 h-3.5", statusConfig.iconColor)} />
                                      {statusConfig.label}
                                    </Badge>
                                    {daysRemaining && (
                                      <Badge variant={daysRemaining.variant} className="gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        {daysRemaining.text}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                      <CalendarDays className="w-4 h-4" />
                                      Created {format(new Date(agreement.createdAt), 'MMM d, yyyy')}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                      <Clock className="w-4 h-4" />
                                      {duration} days
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
                                    <DropdownMenuItem onClick={() => setSelectedAgreement(agreement)}>
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownload(agreement)}>
                                      <Download className="w-4 h-4 mr-2" />
                                      Download
                                    </DropdownMenuItem>
                                    {agreement.status === 'pending' && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                          className="text-green-600"
                                          onClick={() => handleStatusChange(agreement.id, 'approved')}
                                        >
                                          <Check className="w-4 h-4 mr-2" />
                                          Approve
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          className="text-red-600"
                                          onClick={() => handleStatusChange(agreement.id, 'rejected')}
                                        >
                                          <X className="w-4 h-4 mr-2" />
                                          Reject
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Period</Label>
                                  <div className="flex items-center justify-between bg-muted/20 p-3 rounded-lg">
                                    <span className="text-sm">Start</span>
                                    <span className="font-medium">
                                      {format(parseISO(agreement.startDate), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between bg-muted/20 p-3 rounded-lg">
                                    <span className="text-sm">End</span>
                                    <span className="font-medium">
                                      {format(parseISO(agreement.endDate), 'MMM d, yyyy')}
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-muted-foreground">Products</Label>
                                  <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                                    {agreement.products.map((product) => (
                                      <div
                                        key={product.id}
                                        className="flex items-center justify-between p-2 bg-muted/10 rounded"
                                      >
                                        <span className="text-sm font-medium">
                                          {PRODUCT_TYPE_LABELS[product.type]}
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
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-sm text-muted-foreground">Total Value</span>
                                      <span className="text-xl font-bold text-primary">
                                        ₹{agreement.totalValue.toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {agreement.products.length} product{agreement.products.length !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDownload(agreement)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                            {agreement.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                  onClick={() => handleStatusChange(agreement.id, 'approved')}
                                  disabled={isLoading}
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleStatusChange(agreement.id, 'rejected')}
                                  disabled={isLoading}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {agreement.status === 'approved' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => setSelectedAgreement(agreement)}
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Details
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
          {sortedAgreements.length > 0 && (
            <CardFooter className="border-t px-6 py-4">
              <div className="w-full flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Showing {sortedAgreements.length} of {clientAgreements.length} agreements
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/agreements')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  View all clients
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* Agreement Details Dialog */}
      <Dialog open={!!selectedAgreement} onOpenChange={() => setSelectedAgreement(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agreement Details</DialogTitle>
          </DialogHeader>
          {selectedAgreement && (() => {
            const selectedAgreementStatusConfig = getStatusConfig(selectedAgreement.status);
            const SelectedStatusIcon = selectedAgreementStatusConfig.icon;
            const daysRemaining = selectedAgreement.status === 'approved' ? getDaysRemaining(selectedAgreement.endDate) : null;
            const duration = differenceInDays(parseISO(selectedAgreement.endDate), parseISO(selectedAgreement.startDate));
            
            return (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Agreement #{selectedAgreement.id.slice(-8)}</h3>
                    <p className="text-muted-foreground text-sm">
                      Created {format(new Date(selectedAgreement.createdAt), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("gap-1.5", selectedAgreementStatusConfig.color)}>
                      <SelectedStatusIcon className={cn("w-3.5 h-3.5", selectedAgreementStatusConfig.iconColor)} />
                      {selectedAgreementStatusConfig.label}
                    </Badge>
                    {daysRemaining && (
                      <Badge variant={daysRemaining.variant} className="gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {daysRemaining.text}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Start Date</Label>
                    <p className="font-medium">{format(parseISO(selectedAgreement.startDate), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">End Date</Label>
                    <p className="font-medium">{format(parseISO(selectedAgreement.endDate), 'MMM d, yyyy')}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-3 block">Products</Label>
                  <div className="space-y-3">
                    {selectedAgreement.products.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/10 rounded-lg">
                        <div>
                          <p className="font-medium">{PRODUCT_TYPE_LABELS[product.type]}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.quantity} units @ ₹{product.pricePerUnit.toLocaleString('en-IN')}/unit
                          </p>
                        </div>
                        <p className="font-bold">₹{product.totalPrice.toLocaleString('en-IN')}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span>Total Value</span>
                    <span className="text-primary">₹{selectedAgreement.totalValue.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedAgreement.products.length} product{selectedAgreement.products.length !== 1 ? 's' : ''} • {duration} days
                  </div>
                </div>

                {selectedAgreement.termsAndConditions && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground mb-2 block">Terms & Conditions</Label>
                    <p className="text-sm bg-muted/20 p-3 rounded-lg whitespace-pre-line">
                      {selectedAgreement.termsAndConditions}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDownload(selectedAgreement)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  {selectedAgreement.status === 'pending' && (
                    <>
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          handleStatusChange(selectedAgreement.id, 'approved');
                          setSelectedAgreement(null);
                        }}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          handleStatusChange(selectedAgreement.id, 'rejected');
                          setSelectedAgreement(null);
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </>
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