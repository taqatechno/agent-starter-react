'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, X } from '@phosphor-icons/react';
import type { Card } from '@/components/app/new-ui/new-session-view';
import { cn } from '@/lib/utils';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.2,
    },
  },
};

interface CardModalProps {
  card: Card;
  entityType: string;
  onClose: () => void;
}

// Helper functions
const getArabicText = (field: any): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.ar || field.en || '';
};

const formatPayment = (payment: any): string => {
  if (!payment) return 'غير محدد';

  const { amountType, scheduleType, requiredAmount, defaultAmount } = payment;
  const amount = requiredAmount || defaultAmount;

  const typeText = amountType === 'fixed' ? 'ثابتة' : 'مرنة';
  const scheduleText =
    scheduleType === 'monthly' ? 'شهرية' :
    scheduleType === 'one_time' ? 'لمرة واحدة' :
    'مرنة';

  if (amount) {
    return `دفعة ${typeText} ${scheduleText}: ${amount} ريال قطري`;
  }
  return `دفعة ${typeText} ${scheduleText}`;
};

const formatDate = (isoDate: string | null): string => {
  if (!isoDate) return 'غير محدد';
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'غير محدد';
  }
};

const calculateAge = (birthdate: string | null): string => {
  if (!birthdate) return 'غير محدد';
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} سنة`;
};

const translateCategory = (category: string): string => {
  const translations: Record<string, string> = {
    // Sponsorship categories
    orphan: 'يتيم',
    student: 'طالب',
    teacher: 'معلم',
    special_needs: 'ذوي احتياجات خاصة',
    family: 'عائلة',
    // Project types
    mosque: 'مسجد',
    housing: 'إسكان',
    water: 'مياه',
    // Charity types
    sadaqah: 'صدقة',
    feeding_poor: 'إطعام المساكين',
    clothes_donation: 'تبرع بالملابس',
    calamity_relief: 'إغاثة الكوارث',
    remove_affliction: 'رفع البلاء',
    // Atonement types
    debtors: 'الغارمين',
    atonement: 'كفارة',
    aqiqah: 'عقيقة',
    vows: 'نذور',
    purge_income: 'تطهير الدخل',
    fasting_kafara: 'كفارة صيام',
  };
  return translations[category] || category;
};

const translateStatus = (status: string): string => {
  const translations: Record<string, string> = {
    available: 'متاح',
    unavailable: 'غير متاح',
    active: 'نشط',
    completed: 'مكتمل',
    paused: 'متوقف',
    published: 'منشور',
    draft: 'مسودة',
    archived: 'مؤرشف',
  };
  return translations[status] || status;
};

const translateGender = (gender: string | null): string => {
  if (!gender) return 'غير محدد';
  return gender === 'male' ? 'ذكر' : 'أنثى';
};

// Field component for consistent styling
const Field = ({ label, value }: { label: string; value: string | number | null }) => (
  <div className="space-y-1">
    <div className="text-muted-foreground text-xs font-medium">{label}</div>
    <div className="text-foreground text-sm">{value || 'غير محدد'}</div>
  </div>
);

export function CardModal({ card, entityType, onClose }: CardModalProps) {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Sponsorship Modal
  if (entityType === 'sponsorship') {
    const name = getArabicText(card.name);
    const category = translateCategory(card.category);
    const age = calculateAge(card.birthdate);
    const gender = translateGender(card.gender);
    const additionalInfo = getArabicText(card.additionalInfo);
    const status = translateStatus(card.status);
    const payment = formatPayment(card.payment);
    const createdAt = formatDate(card.createdAt);
    const updatedAt = formatDate(card.updatedAt);

    return (
      <>
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-label="Close modal"
        />
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center p-6"
        >
          <div
            className={cn(
              'pointer-events-auto',
              'bg-background border-border rounded-xl border',
              'shadow-2xl',
              'w-full max-w-md max-h-[90vh] overflow-y-auto',
              'scrollbar-thin'
            )}
            onClick={(e) => e.stopPropagation()}
          >
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

            {/* Placeholder Image */}
            <div className="bg-gradient-to-br from-primary/20 to-primary/10 relative aspect-[4/3] w-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-2">🤝</div>
                <div className="text-primary text-sm font-semibold">كفالة</div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <h2 className="text-foreground text-2xl font-bold">{name}</h2>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <Field label="الفئة" value={category} />
                <Field label="العمر" value={age} />
                <Field label="الجنس" value={gender} />
                <Field label="الحالة" value={status} />
              </div>

              {additionalInfo && (
                <div className="space-y-2">
                  <h3 className="text-foreground text-sm font-semibold">معلومات إضافية</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{additionalInfo}</p>
                </div>
              )}

              <div className="border-border border-t pt-4">
                <h3 className="text-foreground mb-3 text-sm font-semibold">معلومات الدفع</h3>
                <div className="text-muted-foreground text-sm">{payment}</div>
              </div>

              <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                  <span className="text-foreground">{createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">آخر تحديث:</span>
                  <span className="text-foreground">{updatedAt}</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'w-full rounded-lg px-4 py-3',
                  'bg-primary text-primary-foreground',
                  'text-sm font-semibold',
                  'flex items-center justify-center gap-2',
                  'hover:bg-primary/90 transition-colors shadow-md'
                )}
              >
                <ShoppingCart className="h-5 w-5" weight="bold" />
                تبرع الآن
              </motion.button>
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  // Project Modal
  if (entityType === 'project') {
    const name = getArabicText(card.name);
    const description = getArabicText(card.description);
    const type = translateCategory(card.type);
    const status = translateStatus(card.status);
    const payment = formatPayment(card.payment);
    const createdAt = formatDate(card.createdAt);
    const updatedAt = formatDate(card.updatedAt);

    const funding = card.funding || {};
    const targetAmount = funding.targetAmount || 0;
    const raisedAmount = funding.raisedAmount || 0;
    const percentage = funding.percentageRaised || 0;

    return (
      <>
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-label="Close modal"
        />
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center p-6"
        >
          <div
            className={cn(
              'pointer-events-auto',
              'bg-background border-border rounded-xl border',
              'shadow-2xl',
              'w-full max-w-md max-h-[90vh] overflow-y-auto',
              'scrollbar-thin'
            )}
            onClick={(e) => e.stopPropagation()}
          >
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

            {/* Placeholder Image */}
            <div className="bg-gradient-to-br from-blue-500/20 to-blue-500/10 relative aspect-[4/3] w-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-2">🏗️</div>
                <div className="text-blue-600 text-sm font-semibold">مشروع</div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <h2 className="text-foreground text-2xl font-bold">{name}</h2>

              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <Field label="نوع المشروع" value={type} />
                <Field label="الحالة" value={status} />
                {card.templateNumber && <Field label="رقم القالب" value={card.templateNumber} />}
                {card.beneficiariesCount && <Field label="عدد المستفيدين" value={card.beneficiariesCount} />}
                {card.implementationDurationDays && (
                  <Field label="مدة التنفيذ" value={`${card.implementationDurationDays} يوم`} />
                )}
              </div>

              {description && (
                <div className="space-y-2">
                  <h3 className="text-foreground text-sm font-semibold">الوصف</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
                </div>
              )}

              <div className="border-border border-t pt-4 space-y-3">
                <h3 className="text-foreground text-sm font-semibold">التمويل</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">المبلغ المستهدف:</span>
                    <span className="text-foreground font-semibold">{targetAmount.toLocaleString()} ريال</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">المبلغ المجموع:</span>
                    <span className="text-primary font-semibold">{raisedAmount.toLocaleString()} ريال</span>
                  </div>
                  <div className="bg-muted h-3 w-full overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="text-center text-primary text-lg font-bold">{percentage.toFixed(1)}%</div>
                </div>
              </div>

              <div className="border-border border-t pt-4">
                <h3 className="text-foreground mb-3 text-sm font-semibold">معلومات الدفع</h3>
                <div className="text-muted-foreground text-sm">{payment}</div>
              </div>

              <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                  <span className="text-foreground">{createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">آخر تحديث:</span>
                  <span className="text-foreground">{updatedAt}</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'w-full rounded-lg px-4 py-3',
                  'bg-primary text-primary-foreground',
                  'text-sm font-semibold',
                  'flex items-center justify-center gap-2',
                  'hover:bg-primary/90 transition-colors shadow-md'
                )}
              >
                <ShoppingCart className="h-5 w-5" weight="bold" />
                تبرع الآن
              </motion.button>
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  // FAQ Modal
  if (entityType === 'faq') {
    const category = getArabicText(card.category);
    const question = getArabicText(card.question);
    const answer = getArabicText(card.answer);
    const status = translateStatus(card.status);
    const createdAt = formatDate(card.createdAt);
    const updatedAt = formatDate(card.updatedAt);

    return (
      <>
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-label="Close modal"
        />
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center p-6"
        >
          <div
            className={cn(
              'pointer-events-auto',
              'bg-background border-border rounded-xl border',
              'shadow-2xl',
              'w-full max-w-md max-h-[90vh] overflow-y-auto',
              'scrollbar-thin'
            )}
            onClick={(e) => e.stopPropagation()}
          >
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

            {/* Placeholder Image */}
            <div className="bg-gradient-to-br from-green-500/20 to-green-500/10 relative aspect-[4/3] w-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-2">❓</div>
                <div className="text-green-600 text-sm font-semibold">الأسئلة الشائعة</div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <div className="bg-primary/10 rounded-lg px-3 py-1 inline-block">
                <span className="text-primary text-xs font-medium">{category}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="text-foreground mb-2 text-sm font-semibold">السؤال</h3>
                  <p className="text-foreground text-base leading-relaxed">{question}</p>
                </div>

                <div className="border-border border-t pt-3">
                  <h3 className="text-foreground mb-2 text-sm font-semibold">الإجابة</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{answer}</p>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <Field label="الحالة" value={status} />
              </div>

              <div className="bg-muted/30 rounded-lg p-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                  <span className="text-foreground">{createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">آخر تحديث:</span>
                  <span className="text-foreground">{updatedAt}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  // Charity Modal
  if (entityType === 'charity') {
    const name = getArabicText(card.name);
    const description = getArabicText(card.description);
    const type = translateCategory(card.type);
    const payment = formatPayment(card.payment);
    const createdAt = formatDate(card.createdAt);

    return (
      <>
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-label="Close modal"
        />
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center p-6"
        >
          <div
            className={cn(
              'pointer-events-auto',
              'bg-background border-border rounded-xl border',
              'shadow-2xl',
              'w-full max-w-md max-h-[90vh] overflow-y-auto',
              'scrollbar-thin'
            )}
            onClick={(e) => e.stopPropagation()}
          >
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

            {/* Placeholder Image */}
            <div className="bg-gradient-to-br from-purple-500/20 to-purple-500/10 relative aspect-[4/3] w-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-2">💝</div>
                <div className="text-purple-600 text-sm font-semibold">صدقة</div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <h2 className="text-foreground text-2xl font-bold">{name}</h2>

              <div className="bg-muted/50 rounded-lg p-4">
                <Field label="نوع الصدقة" value={type} />
              </div>

              {description && (
                <div className="space-y-2">
                  <h3 className="text-foreground text-sm font-semibold">الوصف</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
                </div>
              )}

              <div className="border-border border-t pt-4">
                <h3 className="text-foreground mb-3 text-sm font-semibold">معلومات الدفع</h3>
                <div className="text-muted-foreground text-sm">{payment}</div>
              </div>

              <div className="bg-muted/30 rounded-lg p-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                  <span className="text-foreground">{createdAt}</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'w-full rounded-lg px-4 py-3',
                  'bg-primary text-primary-foreground',
                  'text-sm font-semibold',
                  'flex items-center justify-center gap-2',
                  'hover:bg-primary/90 transition-colors shadow-md'
                )}
              >
                <ShoppingCart className="h-5 w-5" weight="bold" />
                تبرع الآن
              </motion.button>
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  // Atonement Modal
  if (entityType === 'atonement') {
    const name = getArabicText(card.name);
    const description = getArabicText(card.description);
    const type = translateCategory(card.type);
    const payment = formatPayment(card.payment);
    const createdAt = formatDate(card.createdAt);

    return (
      <>
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-label="Close modal"
        />
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center p-6"
        >
          <div
            className={cn(
              'pointer-events-auto',
              'bg-background border-border rounded-xl border',
              'shadow-2xl',
              'w-full max-w-md max-h-[90vh] overflow-y-auto',
              'scrollbar-thin'
            )}
            onClick={(e) => e.stopPropagation()}
          >
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

            {/* Placeholder Image */}
            <div className="bg-gradient-to-br from-amber-500/20 to-amber-500/10 relative aspect-[4/3] w-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-2">🕌</div>
                <div className="text-amber-600 text-sm font-semibold">كفارة</div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              <h2 className="text-foreground text-2xl font-bold">{name}</h2>

              <div className="bg-muted/50 rounded-lg p-4">
                <Field label="نوع الكفارة" value={type} />
              </div>

              {description && (
                <div className="space-y-2">
                  <h3 className="text-foreground text-sm font-semibold">الوصف</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
                </div>
              )}

              <div className="border-border border-t pt-4">
                <h3 className="text-foreground mb-3 text-sm font-semibold">معلومات الدفع</h3>
                <div className="text-muted-foreground text-sm">{payment}</div>
              </div>

              <div className="bg-muted/30 rounded-lg p-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                  <span className="text-foreground">{createdAt}</span>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'w-full rounded-lg px-4 py-3',
                  'bg-primary text-primary-foreground',
                  'text-sm font-semibold',
                  'flex items-center justify-center gap-2',
                  'hover:bg-primary/90 transition-colors shadow-md'
                )}
              >
                <ShoppingCart className="h-5 w-5" weight="bold" />
                تبرع الآن
              </motion.button>
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  // Fallback: Generic modal (if entity type is unknown)
  return (
    <>
      <motion.div
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="absolute inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center p-6"
      >
        <div
          className={cn(
            'pointer-events-auto',
            'bg-background border-border rounded-xl border',
            'shadow-2xl',
            'w-full max-w-md',
            'overflow-hidden'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="absolute top-3 right-3 z-10">
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

          <div className="bg-muted relative aspect-[4/3] w-full flex items-center justify-center">
            <div className="text-6xl">📄</div>
          </div>

          <div className="space-y-4 p-6">
            <h2 className="text-foreground mb-2 text-2xl font-bold">{card.title}</h2>
            <div className="border-border border-t pt-4">
              <h3 className="text-foreground mb-2 text-sm font-semibold">الوصف</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{card.description}</p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'w-full rounded-lg px-4 py-3',
                'bg-primary text-primary-foreground',
                'text-sm font-semibold',
                'flex items-center justify-center gap-2',
                'hover:bg-primary/90 transition-colors shadow-md'
              )}
            >
              <ShoppingCart className="h-5 w-5" weight="bold" />
              تبرع الآن
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
