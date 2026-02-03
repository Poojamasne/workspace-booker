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
  { to: '/admin/invoices', icon: Receipt, label: 'Invoices' },
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
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border z-50 transition-all duration-300 flex flex-col",
          "lg:translate-x-0",
          collapsed ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-sidebar-foreground">WorkSpace</h1>
              <p className="text-xs text-sidebar-muted capitalize">{role} Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setCollapsed(false)}
              className={({ isActive }) =>
                cn(
                  "nav-link",
                  isActive && "nav-link-active"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-medium text-sidebar-accent-foreground">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-sidebar-muted truncate">
                {user?.email || ''}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
