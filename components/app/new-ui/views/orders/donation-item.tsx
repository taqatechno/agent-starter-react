'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface DonationOrder {
  id: string;
  amountQar: number;
  paymentSchedule: 'one_time' | 'monthly';
  status: 'completed' | 'pending' | 'processing' | 'failed' | 'refunded';
  notes?: string;
  createdAt: string;
  donation_item: any;
  transaction: {
    id: string;
    status: string;
  };
}

interface DonationItemProps {
  donation: DonationOrder;
  onClick: () => void;
}

// Helper: Get Arabic text from bilingual field
const getArabicText = (field: any): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.ar || field.en || '';
};

// Helper: Get donation item name
const getDonationItemName = (item: any): string => {
  if (!item) return 'غير محدد';
  if (item.type === 'general') return 'تبرع عام';
  // Access from details wrapper
  return item.details?.nameAr || item.details?.nameEn || 'غير محدد';
};

// Helper: Translate payment schedule
const translateSchedule = (schedule: string): string => {
  return schedule === 'one_time' ? 'مرة واحدة' : 'شهري';
};

// Helper: Translate status
const translateStatus = (status: string): string => {
  const translations: Record<string, string> = {
    completed: 'مكتمل',
    pending: 'قيد الانتظار',
    processing: 'قيد المعالجة',
    failed: 'فشل',
    refunded: 'مسترد',
  };
  return translations[status] || status;
};

// Helper: Get status badge styles
const getStatusBadgeClass = (status: string): string => {
  const baseClass = 'px-2 py-0.5 rounded-full text-[11px] font-medium leading-tight';
  const statusClasses: Record<string, string> = {
    completed: `${baseClass} bg-blue-500/10 text-blue-600`,
    pending: `${baseClass} bg-yellow-500/10 text-yellow-600`,
    processing: `${baseClass} bg-orange-500/10 text-orange-600`,
    failed: `${baseClass} bg-red-500/10 text-red-600`,
    refunded: `${baseClass} bg-purple-500/10 text-purple-600`,
  };
  return statusClasses[status] || baseClass;
};

// Helper: Format date to Arabic
const formatDate = (isoDate: string): string => {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return 'غير محدد';
  }
};

export function DonationItem({ donation, onClick }: DonationItemProps) {
  const itemName = getDonationItemName(donation.donation_item);
  const schedule = translateSchedule(donation.paymentSchedule);
  const status = translateStatus(donation.status);
  const date = formatDate(donation.createdAt);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'bg-card border-border hover:border-primary',
        'rounded-lg border-2 p-3',
        'cursor-pointer',
        'shadow-md hover:shadow-xl',
        'transition-all duration-200'
      )}
      dir="rtl"
    >
      {/* Item Name */}
      <div className="flex items-start justify-between mb-1">
        <h4 className="text-foreground text-sm font-semibold line-clamp-1 leading-tight">{itemName}</h4>
        <span className={getStatusBadgeClass(donation.status)}>{status}</span>
      </div>

      {/* Amount + Schedule */}
      <div className="text-primary text-xs font-medium mb-0.5 leading-tight">
        {donation.amountQar} ر.ق - {schedule}
      </div>

      {/* Date */}
      <div className="text-muted-foreground text-[11px] leading-tight">
        التاريخ: {date}
      </div>
    </motion.div>
  );
}
