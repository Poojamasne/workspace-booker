import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  Receipt,
  IndianRupee,   
  LogOut,
  Building2,
  Settings,
  ChevronLeft,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface SidebarProps {
  role: 'client' | 'admin';
}

const clientNavItems = [
  { to: '/client', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/client/products', icon: Package, label: 'Products' },
  { to: '/client/agreements', icon: FileText, label: 'Agreements' },
  { to: '/client/invoices', icon: Receipt, label: 'Invoices' },
  { to: '/client/profile', icon: Users, label: 'Client Info' },
];

const adminNavItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/clients', icon: Users, label: 'Clients' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/agreements', icon: FileText, label: 'Agreements' },
  { to: '/admin/invoices', icon: IndianRupee, label: 'Invoices' },
];

export default function DashboardSidebar({ role }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = role === 'client' ? clientNavItems : adminNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border z-50 flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2 ml-3">
          <Building2 className="w-6 h-6 text-sidebar-primary" />
          <span className="font-semibold text-sidebar-foreground">WorkSpace</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {collapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setCollapsed(false)}
        />
      )}

      {/* Sidebar */}
      {/* Sidebar */}
<aside
  className={cn(
    "fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 transition-all duration-300 flex flex-col",
    "lg:translate-x-0",
    collapsed ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
    "w-64"
  )}
>
  {/* Logo */}
  <div className="h-16 flex items-center px-6 border-b border-gray-200">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center">
        <img
          src="/logo.png"
          alt="Workspace Logo"
          className="w-7 h-7 object-contain"
        />
      </div>
      <div>
        <h1 className="font-semibold text-gray-900">WorkSpace</h1>
        <p className="text-xs text-gray-500 capitalize">{role} Panel</p>
      </div>
    </div>
  </div>

  {/* Navigation */}
  <nav className="flex-1 p-8 space-y-8 overflow-y-auto">
    {navItems.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        onClick={() => setCollapsed(false)}
        className={({ isActive }) =>
  cn(
    "flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 transition",
    "hover:bg-blue-50 hover:text-blue-700",
    isActive && "bg-blue-100 text-blue-700 font-semibold"
  )

}

      >
        <item.icon className="w-5 h-5" />
        <span>{item.label}</span>
      </NavLink>
    ))}
  </nav>

  {/* User section */}
  <div className="p-4 border-t border-gray-200">
    <div className="flex items-center gap-3 px-3 py-2 mb-3">
      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
        <span className="text-sm font-medium text-gray-700">
          {user?.name?.charAt(0) || 'U'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {user?.name || 'User'}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {user?.email || ''}
        </p>
      </div>
    </div>

    <Button
      variant="ghost"
      className="w-full justify-start text-gray-700 hover:bg-gray-100"
      onClick={handleLogout}
    >
      <LogOut className="w-4 h-4 mr-3" />
      Sign Out
    </Button>
  </div>
</aside>

    </>
  );
}
