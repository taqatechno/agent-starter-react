'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, X } from '@phosphor-icons/react';
import { useRoomContext, useVoiceAssistant } from '@livekit/components-react';
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

// Helper function to get primary project image
const getPrimaryProjectImage = (images?: any[]): string | null => {
  if (!images || images.length === 0) return null;
  const sorted = [...images].sort((a, b) => a.displayOrder - b.displayOrder);
  return sorted[0]?.photoUrl || null;
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
  <div className="space-y-1 text-right">
    <div className="text-muted-foreground text-xs font-medium text-right">{label}</div>
    <div className="text-foreground text-sm text-right">{value || 'غير محدد'}</div>
  </div>
);

export function CardModal({ card, entityType, onClose }: CardModalProps) {
  // Get room and agent context
  const room = useRoomContext();
  const { agent } = useVoiceAssistant();

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

  // Handle donate button click
  const handleDonateClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    console.log(`💳 User clicked donate on ${entityType} card:`, card.id);

    // Check agent availability
    if (!agent) {
      console.warn('⚠️ No agent available to process donation');
      return;
    }

    // Extract card name (bilingual)
    let cardName = '';
    if (entityType === 'faq') {
      cardName = getArabicText(card.question);
    } else {
      cardName = getArabicText(card.name);
    }

    // Build minimal payload - agent will ask for details
    const payload = {
      cardId: card.id,
      cardName: cardName,
    };

    try {
      console.log('📤 Sending agent.initiateDonation RPC...', payload);

      const result = await room.localParticipant.performRpc({
        destinationIdentity: agent.identity,
        method: 'agent.initiateDonation',
        payload: JSON.stringify(payload),
      });

      console.log('✅ Agent acknowledged donation intent:', result);
    } catch (error) {
      console.error('❌ Failed to initiate donation:', error);
    }
  };

  // Sponsorship Modal
  if (entityType === 'sponsorship') {
    const name = getArabicText(card.name);
    const category = translateCategory(card.category);
    const age = calculateAge(card.birthdate);
    const gender = translateGender(card.gender);
    const additionalInfo = getArabicText(card.additionalInfo);
    const amount = card.payment?.requiredAmount || card.payment?.defaultAmount || 0;

    // Get country data - V2 schema
    const country = card.country;
    const countryName = getArabicText(country?.name) || '';

    // Map country names to flag emojis
    const getCountryFlag = (countryName: string): string => {
      const flagMap: Record<string, string> = {
        'كينيا': '🇰🇪', 'Kenya': '🇰🇪',
        'السودان': '🇸🇩', 'Sudan': '🇸🇩',
        'الصومال': '🇸🇴', 'Somalia': '🇸🇴',
        'اليمن': '🇾🇪', 'Yemen': '🇾🇪',
        'سوريا': '🇸🇾', 'Syria': '🇸🇾',
        'فلسطين': '🇵🇸', 'Palestine': '🇵🇸',
        'مصر': '🇪🇬', 'Egypt': '🇪🇬',
        'الأردن': '🇯🇴', 'Jordan': '🇯🇴',
        'لبنان': '🇱🇧', 'Lebanon': '🇱🇧',
        'العراق': '🇮🇶', 'Iraq': '🇮🇶',
        'المغرب': '🇲🇦', 'Morocco': '🇲🇦',
        'الجزائر': '🇩🇿', 'Algeria': '🇩🇿',
        'تونس': '🇹🇳', 'Tunisia': '🇹🇳',
      };
      return flagMap[countryName] || '🌍';
    };

    // Generate sponsorship code
    const sponsorshipCode = card.id ? `PFL-${String(card.id).slice(0, 8)}` : '';

    // Get age category
    const getAgeCategory = (age: number | null): string => {
      if (!age) return 'غير محدد';
      if (age < 6) return 'قبل المدرسة';
      if (age < 12) return 'المرحلة الابتدائية';
      if (age < 15) return 'المرحلة المتوسطة';
      if (age < 18) return 'المرحلة الثانوية';
      return 'بالغ';
    };

    // Format birthdate
    const formatBirthdate = (birthdate: string | null): string => {
      if (!birthdate) return 'غير محدد';
      const date = new Date(birthdate);
      return date.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

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
          className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center p-4 md:p-6"
        >
          <div
            dir="rtl"
            className={cn(
              'pointer-events-auto',
              'bg-background border-border rounded-xl border',
              'shadow-2xl',
              'w-full max-w-lg max-h-[90vh] overflow-y-auto',
              'scrollbar-thin'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Avatar and Share Button */}
            <div className="bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800 relative aspect-[16/9] w-full">
              {/* Share Button (top-left) */}
              <div className="absolute left-4 top-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-lg"
                  aria-label="Share"
                >
                  <span className="text-lg">🔗</span>
                </motion.button>
              </div>

              {/* Avatar/Illustration */}
              <div className="flex h-full w-full items-center justify-center">
                <img
                  src="https://placehold.co/200x200/e2e8f0/64748b?text=Avatar"
                  alt={name}
                  className="h-32 w-32 rounded-full object-cover"
                />
              </div>

              {/* Close Button (top-right) */}
              <div className="absolute right-4 top-4">
                <motion.button
                  type="button"
                  onClick={onClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-background/90 backdrop-blur-sm border border-border shadow-lg"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" weight="bold" />
                </motion.button>
              </div>
            </div>

            <div className="space-y-5 p-5">
              {/* Main Info Card with Gradient Background */}
              <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30 space-y-4 rounded-xl border border-pink-200 dark:border-pink-800 p-5 shadow-md">
                {/* Title */}
                <h2 className="text-foreground text-right text-lg font-bold leading-tight">
                  أكمل التبرع ودعم ذاتهم إلى الأفضل
                </h2>

                {/* Categories */}
                <div className="text-muted-foreground text-right text-sm">
                  الرعاية الاجتماعية / الكفالات الاجتماعية
                </div>

                {/* Sponsorship Code */}
                {sponsorshipCode && (
                  <div className="text-muted-foreground text-right text-xs">
                    رمز: {sponsorshipCode}
                  </div>
                )}

                {/* Country with Flag */}
                {countryName && (
                  <div className="w-full text-right">
                    <span className="inline-flex items-center gap-2">
                      <span className="text-xl">{getCountryFlag(countryName)}</span>
                      <span className="text-muted-foreground text-sm">{countryName}</span>
                    </span>
                  </div>
                )}

                {/* Amount and Donate Button Row */}
                <div className="flex items-center justify-between gap-4 border-t border-pink-200 dark:border-pink-800 pt-4">
                  {/* Sponsor Button */}
                  <motion.button
                    onClick={handleDonateClick}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="bg-[#9F0B56] hover:bg-[#8A0A4B] rounded-lg px-6 py-3 text-sm font-bold text-white shadow-lg transition-all"
                  >
                    اكفل الآن
                  </motion.button>

                  {/* Amount Display */}
                  <div className="text-right">
                    <div className="text-muted-foreground text-xs">مبلغ الكفالة الشهرية</div>
                    <div className="text-foreground text-xl font-bold">{amount} ر.ق</div>
                  </div>
                </div>
              </div>

              {/* Name Section */}
              <div className="text-center">
                <h3 className="text-foreground text-2xl font-bold">{name}</h3>
              </div>

              {/* Statistics Grid (4 columns) */}
              <div className="grid grid-cols-4 gap-3">
                {/* Age */}
                <div className="border-border flex flex-col items-center gap-2 rounded-lg border bg-card p-3 text-center">
                  <div className="text-2xl">🔢</div>
                  <div className="text-muted-foreground text-xs">العمر</div>
                  <div className="text-foreground text-xs font-semibold">{age ? `${age} سنة` : 'غير محدد'}</div>
                </div>

                {/* Birth Date */}
                <div className="border-border flex flex-col items-center gap-2 rounded-lg border bg-card p-3 text-center">
                  <div className="text-2xl">📅</div>
                  <div className="text-muted-foreground text-xs">تاريخ ميلاده</div>
                  <div className="text-foreground text-xs font-semibold">{formatBirthdate(card.birthdate)}</div>
                </div>

                {/* Gender */}
                <div className="border-border flex flex-col items-center gap-2 rounded-lg border bg-card p-3 text-center">
                  <div className="text-2xl">{card.gender === 'female' ? '👧' : '👦'}</div>
                  <div className="text-muted-foreground text-xs">جنس</div>
                  <div className="text-foreground text-xs font-semibold">{gender}</div>
                </div>

                {/* Category */}
                <div className="border-border flex flex-col items-center gap-2 rounded-lg border bg-card p-3 text-center">
                  <div className="text-2xl">📋</div>
                  <div className="text-muted-foreground text-xs">الفئة</div>
                  <div className="text-foreground text-xs font-semibold">{category}</div>
                </div>
              </div>

              {/* Additional Information Section */}
              {additionalInfo && (
                <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                  <h3 className="text-foreground text-right text-base font-bold">مزيد من المعلومات</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-foreground text-right leading-relaxed">{additionalInfo}</p>
                  </div>
                </div>
              )}

              {/* How It Works Section */}
              <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                <h3 className="text-foreground text-right text-base font-bold">
                  كيف تتم عملية الكفالة معنا ؟
                </h3>
                <p className="text-muted-foreground text-right text-sm leading-relaxed">
                  نقوم بالتواصل المعوقة مالكهم عبر الباحثين الميدانيين لنا، للتحقق من احتياجهم ومنحهم الكفالة الفعلية.
                  سنوفر لك تقارير دورية عن الحالة والمستفيدين من كفالتك، مع إمكانية التواصل المباشر معهم في بعض الحالات.
                </p>
              </div>
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
    const createdAt = formatDate(card.createdAt);
    const updatedAt = formatDate(card.updatedAt);

    const funding = card.funding || {};
    const targetAmount = funding.targetAmount || 0;
    const raisedAmount = funding.raisedAmount || 0;
    const percentage = funding.percentageRaised || 0;
    const remaining = targetAmount - raisedAmount;

    // Get country data - V2 schema
    const country = card.country;
    const countryName = getArabicText(country?.name) || '';

    // Map country names to flag emojis
    const getCountryFlag = (countryName: string): string => {
      const flagMap: Record<string, string> = {
        'كينيا': '🇰🇪', 'Kenya': '🇰🇪',
        'السودان': '🇸🇩', 'Sudan': '🇸🇩',
        'الصومال': '🇸🇴', 'Somalia': '🇸🇴',
        'اليمن': '🇾🇪', 'Yemen': '🇾🇪',
        'سوريا': '🇸🇾', 'Syria': '🇸🇾',
        'فلسطين': '🇵🇸', 'Palestine': '🇵🇸',
        'مصر': '🇪🇬', 'Egypt': '🇪🇬',
        'الأردن': '🇯🇴', 'Jordan': '🇯🇴',
        'لبنان': '🇱🇧', 'Lebanon': '🇱🇧',
        'العراق': '🇮🇶', 'Iraq': '🇮🇶',
        'المغرب': '🇲🇦', 'Morocco': '🇲🇦',
        'الجزائر': '🇩🇿', 'Algeria': '🇩🇿',
        'تونس': '🇹🇳', 'Tunisia': '🇹🇳',
      };
      return flagMap[countryName] || '🌍';
    };

    // Generate project code (if card has id)
    const projectCode = card.id ? `PR${String(card.id).slice(0, 8)}` : '';

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
          className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center p-4 md:p-6"
        >
          <div
            dir="rtl"
            className={cn(
              'pointer-events-auto',
              'bg-background border-border rounded-xl border',
              'shadow-2xl',
              'w-full max-w-2xl max-h-[90vh] overflow-y-auto',
              'scrollbar-thin'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <div className="sticky top-0 left-0 z-10 flex justify-start p-3">
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

            {/* Hero Image with Status Badge */}
            <div className="relative aspect-[21/9] w-full overflow-hidden">
              <img
                src={getPrimaryProjectImage(card.images) || `https://placehold.co/1200x500/3b82f6/ffffff?text=Project+Image`}
                alt={name}
                className="h-full w-full object-cover"
              />
              {/* Status Badge on Image */}
              <div className="absolute right-4 bottom-4">
                <span className="bg-amber-50/95 text-amber-700 dark:bg-amber-950/95 dark:text-amber-300 rounded-lg px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur-sm">
                  {type}
                </span>
              </div>
            </div>

            <div className="space-y-6 p-6">
              {/* Title and Donate Button Row */}
              <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                {/* Title and Info (right side) */}
                <div className="flex-1 space-y-2">
                  <h2 className="text-foreground text-right text-2xl font-bold leading-tight md:text-3xl">
                    {name}
                  </h2>

                  {/* Project Code */}
                  {projectCode && (
                    <div className="text-muted-foreground text-right text-sm">
                      رمز: {projectCode}
                    </div>
                  )}

                  {/* Location with Flag */}
                  {countryName && (
                    <div className="w-full text-right">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-xl">{getCountryFlag(countryName)}</span>
                        <span className="text-muted-foreground text-sm">{countryName}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Donate Button (left on desktop) */}
                <motion.button
                  onClick={handleDonateClick}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-[#9F0B56] hover:bg-[#8A0A4B] w-full rounded-lg px-6 py-3 text-base font-bold text-white transition-all duration-200 shadow-lg md:w-auto"
                >
                  تبرع الآن
                </motion.button>
              </div>

              {/* Progress Section */}
              <div className="bg-muted/30 rounded-lg p-5 space-y-3">
                {/* Progress Bar */}
                <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      background: '#9F0B56',
                    }}
                  />
                </div>

                {/* Progress Stats */}
                <div className="flex items-center justify-between">
                  <span className="text-foreground text-sm font-semibold">{percentage.toFixed(0)}%</span>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-foreground font-bold">{raisedAmount.toLocaleString()}</span>
                    <span className="text-muted-foreground">من</span>
                    <span className="text-muted-foreground">{targetAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Remaining Amount */}
                {remaining > 0 && (
                  <div className="text-muted-foreground text-right text-sm">
                    <span className="font-semibold">{remaining.toLocaleString()}</span> ريال متبقي
                  </div>
                )}
              </div>

              {/* Statistics Grid (3 columns) */}
              <div className="grid grid-cols-3 gap-4">
                {/* Beneficiaries */}
                {card.beneficiariesCount && (
                  <div className="border-border flex flex-col items-center gap-2 rounded-lg border bg-card p-4 text-center">
                    <div className="text-primary text-2xl">👥</div>
                    <div className="text-muted-foreground text-xs">عدد المستفيدين</div>
                    <div className="text-foreground text-base font-bold">
                      {card.beneficiariesCount} مستفيد
                    </div>
                  </div>
                )}

                {/* Implementation Duration */}
                {card.implementationDurationDays && (
                  <div className="border-border flex flex-col items-center gap-2 rounded-lg border bg-card p-4 text-center">
                    <div className="text-primary text-2xl">⏱️</div>
                    <div className="text-muted-foreground text-xs">مدة التنفيذ</div>
                    <div className="text-foreground text-base font-bold">
                      {Math.round(card.implementationDurationDays / 30)} شهر
                    </div>
                  </div>
                )}

                {/* Template Number */}
                {card.templateNumber && (
                  <div className="border-border flex flex-col items-center gap-2 rounded-lg border bg-card p-4 text-center">
                    <div className="text-primary text-2xl">📋</div>
                    <div className="text-muted-foreground text-xs">رقم محضر</div>
                    <div className="text-foreground text-base font-bold">{card.templateNumber}</div>
                  </div>
                )}
              </div>

              {/* Description Section */}
              {description && (
                <div className="border-border space-y-3 rounded-lg border bg-muted/20 p-5">
                  <h3 className="text-foreground text-right text-lg font-bold">وصف المشروع</h3>
                  <p className="text-foreground text-right text-sm leading-relaxed">{description}</p>
                </div>
              )}

              {/* Project-Specific Details Section */}
              {card.details && (
                <div className="border-border space-y-3 rounded-lg border bg-muted/20 p-5">
                  <h3 className="text-foreground text-right text-lg font-bold">التفاصيل الفنية</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Mosque Details */}
                    {card.type === 'mosque' && (
                      <>
                        {card.details.capacity && (
                          <Field label="سعة المصلين" value={`${card.details.capacity} مصلي`} />
                        )}
                        {card.details.areaSqm && (
                          <Field label="المساحة" value={`${card.details.areaSqm} متر مربع`} />
                        )}
                        {card.details.hasMinaret !== undefined && (
                          <Field label="المئذنة" value={card.details.hasMinaret ? 'نعم' : 'لا'} />
                        )}
                        {card.details.hasDome !== undefined && (
                          <Field label="القبة" value={card.details.hasDome ? 'نعم' : 'لا'} />
                        )}
                      </>
                    )}

                    {/* Water Details */}
                    {card.type === 'water' && (
                      <>
                        {card.details.depthMeters && (
                          <Field label="العمق" value={`${card.details.depthMeters} متر`} />
                        )}
                        {card.details.capacityLitersPerHour && (
                          <Field label="الإنتاجية" value={`${card.details.capacityLitersPerHour} لتر/ساعة`} />
                        )}
                      </>
                    )}

                    {/* Housing Details */}
                    {card.type === 'housing' && (
                      <>
                        {card.details.numUnits && (
                          <Field label="عدد الوحدات" value={`${card.details.numUnits} وحدة`} />
                        )}
                        {card.details.roomsPerUnit && (
                          <Field label="عدد الغرف لكل وحدة" value={`${card.details.roomsPerUnit} غرفة`} />
                        )}
                        {card.details.areaSqm && (
                          <Field label="مساحة الوحدة" value={`${card.details.areaSqm} متر مربع`} />
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata (minimized) */}
              <div className="border-border border-t pt-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>تم التحديث: {updatedAt}</span>
                  <span>تم الإنشاء: {createdAt}</span>
                </div>
              </div>
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
                  <h3 className="text-foreground mb-2 text-sm font-semibold text-right">السؤال</h3>
                  <p className="text-foreground text-base leading-relaxed text-right">{question}</p>
                </div>

                <div className="border-border border-t pt-3">
                  <h3 className="text-foreground mb-2 text-sm font-semibold text-right">الإجابة</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed text-right">{answer}</p>
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
              <h2 className="text-foreground text-2xl font-bold text-right">{name}</h2>

              <div className="bg-muted/50 rounded-lg p-4">
                <Field label="نوع الصدقة" value={type} />
              </div>

              {description && (
                <div className="space-y-2">
                  <h3 className="text-foreground text-sm font-semibold text-right">الوصف</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed text-right">{description}</p>
                </div>
              )}

              <div className="border-border border-t pt-4">
                <h3 className="text-foreground mb-3 text-sm font-semibold text-right">معلومات الدفع</h3>
                <div className="text-muted-foreground text-sm text-right">{payment}</div>
              </div>

              <div className="bg-muted/30 rounded-lg p-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                  <span className="text-foreground">{createdAt}</span>
                </div>
              </div>

              <motion.button
                onClick={handleDonateClick}
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
              <h2 className="text-foreground text-2xl font-bold text-right">{name}</h2>

              <div className="bg-muted/50 rounded-lg p-4">
                <Field label="نوع الكفارة" value={type} />
              </div>

              {description && (
                <div className="space-y-2">
                  <h3 className="text-foreground text-sm font-semibold text-right">الوصف</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed text-right">{description}</p>
                </div>
              )}

              <div className="border-border border-t pt-4">
                <h3 className="text-foreground mb-3 text-sm font-semibold text-right">معلومات الدفع</h3>
                <div className="text-muted-foreground text-sm text-right">{payment}</div>
              </div>

              <div className="bg-muted/30 rounded-lg p-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">تاريخ الإنشاء:</span>
                  <span className="text-foreground">{createdAt}</span>
                </div>
              </div>

              <motion.button
                onClick={handleDonateClick}
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
          dir="rtl"
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
            <h2 className="text-foreground mb-2 text-2xl font-bold text-right">{card.title}</h2>
            <div className="border-border border-t pt-4">
              <h3 className="text-foreground mb-2 text-sm font-semibold text-right">الوصف</h3>
              <p className="text-muted-foreground text-sm leading-relaxed text-right">{card.description}</p>
            </div>

            <motion.button
              onClick={handleDonateClick}
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
