import React from 'react';
import { InvoiceStatus, AgreementStatus } from '@/types';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: InvoiceStatus | AgreementStatus | string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  // Invoice statuses
  draft: 'badge-muted',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'badge-success',
  pending: 'badge-warning',
  overdue: 'badge-destructive',
  
  // Agreement statuses
  approved: 'badge-success',
  rejected: 'badge-destructive',
  
  // Product statuses
  active: 'badge-success',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'badge-destructive',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  pending: 'Pending',
  overdue: 'Overdue',
  approved: 'Approved',
  rejected: 'Rejected',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      "badge-status",
      statusStyles[status] || 'badge-muted',
      className
    )}>
      {statusLabels[status] || status}
    </span>
  );
}
