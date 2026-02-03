import React, { ReactNode } from 'react';
import DashboardSidebar from './DashboardSidebar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  role: 'client' | 'admin';
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar role={role} />
      
      {/* Main content */}
      <main className={cn(
        "lg:ml-64 min-h-screen",
        "pt-16 lg:pt-0" // Account for mobile header
      )}>
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
