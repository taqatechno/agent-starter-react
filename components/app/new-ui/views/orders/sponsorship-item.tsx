'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface SponsorshipOrder {
  id: string;
  amountQar: number;
  paymentSchedule: 'monthly';
  status: 'completed' | 'pending' | 'processing' | 'failed' | 'refunded';
  createdAt: string;
  sponsorship_item: any;
  transaction: {
    id: string;
    status: string;
  };
}

interface SponsorshipItemProps {
  sponsorship: SponsorshipOrder;
  onClick: () => void;
}

// Helper: Get Arabic text from bilingual field
const getArabicText = (field: any): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.ar || field.en || '';
};

// Helper: Calculate age from birthdate
const calculateAge = (birthdate: string | null): number | null => {
  if (!birthdate) return null;
  try {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
};

// Helper: Translate category
const translateCategory = (category: string): string => {
  const translations: Record<string, string> = {
    orphan: 'يتيم',
    student: 'طالب',
    teacher: 'معلم',
    special_needs: 'ذوي احتياجات خاصة',
    family: 'عائلة',
  };
  return translations[category] || category;
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

export function SponsorshipItem({ sponsorship, onClick }: SponsorshipItemProps) {
  const item = sponsorship.sponsorship_item;
  // Access from details wrapper
  const name = item?.details?.nameAr || item?.details?.nameEn || 'غير محدد';
  const category = item?.details?.category ? translateCategory(item.details.category) : null;
  const age = item?.details?.birthdate ? calculateAge(item.details.birthdate) : null;
  const status = translateStatus(sponsorship.status);
  const date = formatDate(sponsorship.createdAt);

  // Build subtitle (category, age)
  const subtitle = [category, age ? `${age} سنة` : null].filter(Boolean).join('، ');

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
      {/* Name + Status */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <h4 className="text-foreground text-sm font-semibold line-clamp-1 leading-tight">{name}</h4>
          {subtitle && <p className="text-muted-foreground text-[11px] mt-0.5 leading-tight">{subtitle}</p>}
        </div>
        <span className={getStatusBadgeClass(sponsorship.status)}>{status}</span>
      </div>

      {/* Amount (always monthly for sponsorships) */}
      <div className="text-primary text-xs font-medium mb-0.5 leading-tight">
        {sponsorship.amountQar} ر.ق - شهري
      </div>

      {/* Date */}
      <div className="text-muted-foreground text-[11px] leading-tight">
        التاريخ: {date}
      </div>
    </motion.div>
  );
}
