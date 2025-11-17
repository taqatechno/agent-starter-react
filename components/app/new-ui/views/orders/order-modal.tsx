'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import { X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface OrderModalProps {
  order: {
    type: 'donation' | 'sponsorship';
    data: any;
  };
  onClose: () => void;
}

// Animation variants
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 },
  },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.2 } },
};

// Helper: Get Arabic text
const getArabicText = (field: any): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.ar || field.en || '';
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

// Helper: Format date
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

// Helper: Calculate age
const calculateAge = (birthdate: string | null): string => {
  if (!birthdate) return 'غير محدد';
  try {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age} سنة`;
  } catch {
    return 'غير محدد';
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
    mosque: 'مسجد',
    housing: 'إسكان',
    water: 'مياه',
    sadaqah: 'صدقة',
    feeding_poor: 'إطعام المساكين',
    clothes_donation: 'تبرع بالملابس',
    calamity_relief: 'إغاثة الكوارث',
    remove_affliction: 'رفع البلاء',
    debtors: 'الغارمين',
    atonement: 'كفارة',
    aqiqah: 'عقيقة',
    vows: 'نذور',
    purge_income: 'تطهير الدخل',
    fasting_kafara: 'كفارة صيام',
  };
  return translations[category] || category;
};

// Helper: Translate gender
const translateGender = (gender: string | null): string => {
  if (!gender) return 'غير محدد';
  return gender === 'male' ? 'ذكر' : 'أنثى';
};

// Field component
const Field = ({ label, value }: { label: string; value: string | number | null }) => (
  <div className="space-y-1 text-right">
    <div className="text-muted-foreground text-xs font-medium">{label}</div>
    <div className="text-foreground text-sm">{value || 'غير محدد'}</div>
  </div>
);

export function OrderModal({ order, onClose }: OrderModalProps) {
  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const { type, data } = order;
  const isDonation = type === 'donation';

  // Common fields
  const amount = `${data.amountQar} ر.ق`;
  const schedule = translateSchedule(data.paymentSchedule);
  const status = translateStatus(data.status);
  const date = formatDate(data.createdAt);
  const transactionId = data.transaction?.id || 'غير محدد';
  const transactionStatus = translateStatus(data.transaction?.status || '');

  // Entity-specific fields
  let entityName = 'غير محدد';
  let entityFields: JSX.Element[] = [];

  if (isDonation) {
    const item = data.donation_item;
    if (item) {
      if (item.type === 'general') {
        entityName = 'تبرع عام';
      } else {
        // Access from details wrapper
        entityName = item.details?.nameAr || item.details?.nameEn || 'غير محدد';

        // Add type-specific fields
        if (item.type === 'project') {
          entityFields.push(<Field key="project-type" label="نوع المشروع" value={translateCategory(item.type)} />);
          if (item.details?.country?.nameAr || item.details?.country?.nameEn) {
            entityFields.push(<Field key="country" label="الدولة" value={item.details.country.nameAr || item.details.country.nameEn} />);
          }
        } else if (item.type === 'charity' || item.type === 'atonement') {
          entityFields.push(<Field key="item-type" label="النوع" value={translateCategory(item.type)} />);
        }
      }
    }
  } else {
    // Sponsorship
    const item = data.sponsorship_item;
    if (item) {
      // Access from details wrapper
      entityName = item.details?.nameAr || item.details?.nameEn || 'غير محدد';
      entityFields = [
        <Field key="category" label="الفئة" value={translateCategory(item.details?.category || '')} />,
        <Field key="age" label="العمر" value={calculateAge(item.details?.birthdate || null)} />,
        <Field key="gender" label="الجنس" value={translateGender(item.details?.gender || null)} />,
      ];
      if (item.details?.country?.nameAr || item.details?.country?.nameEn) {
        entityFields.push(<Field key="country" label="الدولة" value={item.details.country.nameAr || item.details.country.nameEn} />);
      }
    }
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal */}
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center p-6"
      >
        <div
          dir="rtl"
          className={cn(
            'pointer-events-auto',
            'bg-background border-border rounded-xl border',
            'shadow-2xl',
            'w-full max-w-md max-h-[90vh] overflow-y-auto',
            'scrollbar-thin'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <div className="sticky top-0 right-0 z-10 flex justify-end p-3">
            <motion.button
              type="button"
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={cn(
                'rounded-full p-2',
                'bg-background/90 backdrop-blur-sm',
                'border-border border',
                'text-muted-foreground hover:text-foreground',
                'transition-colors shadow-md'
              )}
              aria-label="Close modal"
            >
              <X className="h-5 w-5" weight="bold" />
            </motion.button>
          </div>

          <div className="space-y-4 p-6 pt-0">
            {/* Header */}
            <div className="text-center">
              <div className="text-4xl mb-2">{isDonation ? '💝' : '🤝'}</div>
              <h2 className="text-foreground text-2xl font-bold text-right">{entityName}</h2>
              <p className="text-muted-foreground text-sm text-right mt-1">
                {isDonation ? 'تبرع' : 'كفالة'}
              </p>
            </div>

            {/* Order Information */}
            <div className="border-border border-t pt-4">
              <h3 className="text-foreground mb-3 text-sm font-semibold text-right">معلومات الطلب</h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <Field label="رقم الطلب" value={data.id} />
                <Field label="المبلغ" value={amount} />
                <Field label="نوع الدفع" value={schedule} />
                <Field label="الحالة" value={status} />
                <Field label="التاريخ" value={date} />
                {data.notes && <Field label="ملاحظات" value={data.notes} />}
              </div>
            </div>

            {/* Entity Information */}
            {entityFields.length > 0 && (
              <div className="border-border border-t pt-4">
                <h3 className="text-foreground mb-3 text-sm font-semibold text-right">
                  {isDonation ? 'تفاصيل التبرع' : 'تفاصيل الكفالة'}
                </h3>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">{entityFields}</div>
              </div>
            )}

            {/* Transaction Information */}
            <div className="border-border border-t pt-4">
              <h3 className="text-foreground mb-3 text-sm font-semibold text-right">معلومات الدفع</h3>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <Field label="رقم المعاملة" value={transactionId} />
                <Field label="حالة المعاملة" value={transactionStatus} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
