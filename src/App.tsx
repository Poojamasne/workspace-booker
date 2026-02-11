import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";

// Pages
import Login from "./pages/Login";
import ClientDashboard from "./pages/client/ClientDashboard";
import ClientProducts from "./pages/client/ClientProducts";
import ClientAgreements from "./pages/client/ClientAgreements";
import ClientInvoices from "./pages/client/ClientInvoices";
import ClientProfile from "./pages/client/ClientProfile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminClients from "./pages/admin/AdminClients";
import AdminClientDetail from "./pages/admin/AdminClientDetail"
import ClientAgreementsDetails from "./pages/client/ClientAgreementsDetails";

import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductsDetails from "./pages/admin/AdminProductsDetails";
import AdminAgreements from "./pages/admin/AdminAgreements";
import AdminInvoices from "./pages/admin/AdminInvoices";
import AdminClientAgreementsDetails from "./pages/admin/AdminClientAgreementsDetails";
import AdminClientInvoiceDetails from "./pages/admin/AdminClientInvoiceDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole?: 'client' | 'admin' }) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/client'} replace />;
  }

  return <>{children}</>;
}

function RoleBasedRedirect() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user?.role === 'admin' ? '/admin' : '/client'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RoleBasedRedirect />} />
      <Route path="/login" element={<Login />} />
      
      {/* Client Routes */}
      <Route path="/client" element={<ProtectedRoute allowedRole="client"><ClientDashboard /></ProtectedRoute>} />
      <Route path="/client/products" element={<ProtectedRoute allowedRole="client"><ClientProducts /></ProtectedRoute>} />
      <Route path="/client/agreements" element={<ProtectedRoute allowedRole="client"><ClientAgreements /></ProtectedRoute>} />
      <Route path="/client/agreements/:clientId" element={<ProtectedRoute allowedRole="client"><ClientAgreementsDetails /></ProtectedRoute>} />

      <Route path="/client/invoices" element={<ProtectedRoute allowedRole="client"><ClientInvoices /></ProtectedRoute>} />
      <Route path="/client/profile" element={<ProtectedRoute allowedRole="client"><ClientProfile /></ProtectedRoute>} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/clients" element={<ProtectedRoute allowedRole="admin"><AdminClients /></ProtectedRoute>} />
      
      <Route path="/admin/clients/:clientId" element={<ProtectedRoute allowedRole="admin"><AdminClientDetail/></ProtectedRoute>} />

      <Route path="/admin/products" element={<ProtectedRoute allowedRole="admin"><AdminProducts /></ProtectedRoute>} />
      <Route path="/admin/products/:productId" element={<ProtectedRoute allowedRole="admin"><AdminProductsDetails/></ProtectedRoute>} />
      <Route path="/admin/agreements" element={<ProtectedRoute allowedRole="admin"><AdminAgreements /></ProtectedRoute>} />
      <Route path="/admin/invoices" element={<ProtectedRoute allowedRole="admin"><AdminInvoices /></ProtectedRoute>} />
       <Route path="/admin/agreements/:clientId" element={<ProtectedRoute allowedRole="admin"><AdminClientAgreementsDetails /></ProtectedRoute>} />
      <Route path="/admin/invoices/:clientId" element={<ProtectedRoute allowedRole="admin"><AdminClientInvoiceDetails/></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <DataProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
