'use client';

import { motion } from 'motion/react';
import type { Card } from '@/components/app/new-ui/new-session-view';
import { cn } from '@/lib/utils';

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 20,
    },
  },
  hover: {
    scale: 1.05,
    y: -4,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  tap: {
    scale: 0.98,
  },
};

interface CardItemProps {
  card: Card;
  entityType: string;
  onClick: () => void;
}

// Helper functions to extract Arabic text
const getArabicText = (field: any): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.ar || field.en || '';
};

const calculateAge = (birthdate: string | null): number | null => {
  if (!birthdate) return null;
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

// Category/Type label translation
const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
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
  return labels[category] || category;
};

export function CardItem({ card, entityType, onClick }: CardItemProps) {
  // Sponsorship card layout
  if (entityType === 'sponsorship') {
    const name = getArabicText(card.name);
    const category = card.category;
    const categoryLabel = getCategoryLabel(category);
    const age = calculateAge(card.birthdate);
    const amount = card.payment?.requiredAmount || card.payment?.defaultAmount;
    const gender = card.gender; // male, female

    // Get country data - try multiple paths for compatibility
    const country = card.details?.country || card.country;
    const countryName = getArabicText(country?.name) || getArabicText(country) || 'غير محدد';

    // Map Arabic country names to flag emojis (reuse same function as projects)
    const getCountryFlag = (countryName: string): string => {
      const flagMap: Record<string, string> = {
        'كينيا': '🇰🇪',
        'Kenya': '🇰🇪',
        'السودان': '🇸🇩',
        'Sudan': '🇸🇩',
        'الصومال': '🇸🇴',
        'Somalia': '🇸🇴',
        'اليمن': '🇾🇪',
        'Yemen': '🇾🇪',
        'سوريا': '🇸🇾',
        'Syria': '🇸🇾',
        'فلسطين': '🇵🇸',
        'Palestine': '🇵🇸',
        'مصر': '🇪🇬',
        'Egypt': '🇪🇬',
        'الأردن': '🇯🇴',
        'Jordan': '🇯🇴',
        'لبنان': '🇱🇧',
        'Lebanon': '🇱🇧',
        'العراق': '🇮🇶',
        'Iraq': '🇮🇶',
        'المغرب': '🇲🇦',
        'Morocco': '🇲🇦',
        'الجزائر': '🇩🇿',
        'Algeria': '🇩🇿',
        'تونس': '🇹🇳',
        'Tunisia': '🇹🇳',
        'ليبيا': '🇱🇾',
        'Libya': '🇱🇾',
        'السعودية': '🇸🇦',
        'Saudi Arabia': '🇸🇦',
        'الإمارات': '🇦🇪',
        'UAE': '🇦🇪',
        'قطر': '🇶🇦',
        'Qatar': '🇶🇦',
        'الكويت': '🇰🇼',
        'Kuwait': '🇰🇼',
        'البحرين': '🇧🇭',
        'Bahrain': '🇧🇭',
        'عمان': '🇴🇲',
        'Oman': '🇴🇲',
      };
      return flagMap[countryName] || '🌍';
    };

    // Get gender label
    const getGenderLabel = (gender: string): string => {
      return gender === 'female' ? 'أنثى' : 'ذكور';
    };

    return (
      <motion.div
        variants={{
          ...cardVariants,
          hover: {
            scale: 1.02,
            y: -2,
            transition: {
              type: 'spring',
              stiffness: 400,
              damping: 25,
            },
          },
        }}
        whileHover="hover"
        whileTap="tap"
        className={cn(
          'w-full max-w-[320px]',
          'flex flex-col overflow-hidden',
          'bg-card border-border hover:border-primary rounded-xl border',
          'cursor-pointer',
          'shadow-md hover:shadow-xl',
          'transition-all duration-200'
        )}
      >
        {/* Card content wrapper - clickable area for modal */}
        <div onClick={onClick} className="flex-1">
          {/* Top section with avatar and info */}
          <div className="flex gap-3 p-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <img
                src={`https://placehold.co/100x100/e2e8f0/64748b?text=Avatar`}
                alt={name}
                className="h-[100px] w-[100px] rounded-lg object-cover"
              />
            </div>

            {/* Person Info */}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {/* Name */}
              <h3 className="text-foreground line-clamp-2 text-right text-base font-bold leading-tight">
                {name}
              </h3>

              {/* Age and Gender */}
              {(age || gender) && (
                <div className="text-muted-foreground text-right text-sm">
                  {age && <span>{age} </span>}
                  {gender && <span>{getGenderLabel(gender)}</span>}
                </div>
              )}

              {/* Location with flag */}
              <div className="w-full text-right">
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-lg leading-none">{getCountryFlag(countryName)}</span>
                  <span className="text-muted-foreground text-sm">{countryName}</span>
                </span>
              </div>

              {/* Category Badge */}
              <div className="inline-flex self-end">
                <span className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 rounded-md px-3 py-1 text-xs font-medium">
                  {categoryLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Amount Section */}
          <div className="px-4 pb-3">
            <div className="text-muted-foreground text-right text-xs">تبرع الكفالة الشهرية</div>
            {amount && (
              <div className="text-foreground mt-1 text-right text-lg font-bold">
                {amount.toLocaleString()} ريال
              </div>
            )}
          </div>
        </div>

        {/* Sponsor Button - separate from clickable area */}
        <div className="border-t border-border p-3">
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click when clicking button
              onClick();
            }}
            className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-all duration-200"
          >
            أكفلني
          </button>
        </div>
      </motion.div>
    );
  }

  // Project card layout
  if (entityType === 'project') {
    const name = getArabicText(card.name);
    const type = card.type;
    const typeLabel = getCategoryLabel(type);
    const funding = card.funding;
    const percentage = funding?.percentageRaised || 0;
    const raised = funding?.raisedAmount || 0; // Fixed: was amountRaised
    const target = funding?.targetAmount || 0;
    const remaining = target - raised;

    // Get country data - try multiple paths for compatibility
    const country = card.details?.country || card.country;
    const countryName = getArabicText(country?.name) || getArabicText(country) || 'غير محدد';

    // Map Arabic country names to flag emojis
    const getCountryFlag = (countryName: string): string => {
      const flagMap: Record<string, string> = {
        'كينيا': '🇰🇪',
        'Kenya': '🇰🇪',
        'السودان': '🇸🇩',
        'Sudan': '🇸🇩',
        'الصومال': '🇸🇴',
        'Somalia': '🇸🇴',
        'اليمن': '🇾🇪',
        'Yemen': '🇾🇪',
        'سوريا': '🇸🇾',
        'Syria': '🇸🇾',
        'فلسطين': '🇵🇸',
        'Palestine': '🇵🇸',
        'مصر': '🇪🇬',
        'Egypt': '🇪🇬',
        'الأردن': '🇯🇴',
        'Jordan': '🇯🇴',
        'لبنان': '🇱🇧',
        'Lebanon': '🇱🇧',
        'العراق': '🇮🇶',
        'Iraq': '🇮🇶',
        'المغرب': '🇲🇦',
        'Morocco': '🇲🇦',
        'الجزائر': '🇩🇿',
        'Algeria': '🇩🇿',
        'تونس': '🇹🇳',
        'Tunisia': '🇹🇳',
        'ليبيا': '🇱🇾',
        'Libya': '🇱🇾',
        'السعودية': '🇸🇦',
        'Saudi Arabia': '🇸🇦',
        'الإمارات': '🇦🇪',
        'UAE': '🇦🇪',
        'قطر': '🇶🇦',
        'Qatar': '🇶🇦',
        'الكويت': '🇰🇼',
        'Kuwait': '🇰🇼',
        'البحرين': '🇧🇭',
        'Bahrain': '🇧🇭',
        'عمان': '🇴🇲',
        'Oman': '🇴🇲',
      };
      return flagMap[countryName] || '🌍';
    };

    return (
      <motion.div
        variants={{
          ...cardVariants,
          hover: {
            scale: 1.02,
            y: -2,
            transition: {
              type: 'spring',
              stiffness: 400,
              damping: 25,
            },
          },
        }}
        whileHover="hover"
        whileTap="tap"
        className={cn(
          'w-full max-w-[320px]',
          'flex flex-col overflow-hidden',
          'bg-card border-border hover:border-primary rounded-xl border',
          'cursor-pointer',
          'shadow-md hover:shadow-xl',
          'transition-all duration-200'
        )}
      >
        {/* Card content wrapper - clickable area for modal */}
        <div onClick={onClick} className="flex-1">
          {/* Top section with image and info */}
          <div className="flex gap-3 p-4">
            {/* Project Image */}
            <div className="flex-shrink-0">
              <img
                src={`https://placehold.co/100x100/e2e8f0/64748b?text=Project`}
                alt={name}
                className="h-[100px] w-[100px] rounded-lg object-cover"
              />
            </div>

            {/* Project Info */}
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {/* Title */}
              <h3 className="text-foreground line-clamp-2 text-right text-base font-bold leading-tight">
                {name}
              </h3>

              {/* Location with flag */}
              <div className="w-full text-right">
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-lg leading-none">{getCountryFlag(countryName)}</span>
                  <span className="text-muted-foreground text-sm">{countryName}</span>
                </span>
              </div>

              {/* Status Badge */}
              <div className="inline-flex self-end">
                <span className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 rounded-md px-3 py-1 text-xs font-medium">
                  {typeLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="px-4 pb-3">
            {/* Progress Bar */}
            <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.min(percentage, 100)}%`,
                  background: 'linear-gradient(90deg, #fb923c 0%, #f43f5e 100%)',
                }}
              />
            </div>

            {/* Funding Stats */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground text-xs">{percentage.toFixed(0)}%</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-foreground font-semibold">
                  {raised.toLocaleString()}
                </span>
                <span className="text-muted-foreground">من</span>
                <span className="text-muted-foreground">{target.toLocaleString()}</span>
              </div>
            </div>

            {/* Remaining Amount */}
            <div className="text-muted-foreground mt-1 text-right text-xs">
              {remaining > 0 && (
                <>
                  <span className="font-medium">{remaining.toLocaleString()}</span> متبقي
                </>
              )}
            </div>
          </div>
        </div>

        {/* Donate Button - separate from clickable area */}
        <div className="border-t border-border p-3">
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click when clicking button
              onClick();
            }}
            className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 w-full rounded-lg py-2.5 text-sm font-semibold text-white transition-all duration-200"
          >
            تبرع الآن
          </button>
        </div>
      </motion.div>
    );
  }

  // FAQ card layout
  if (entityType === 'faq') {
    const question = getArabicText(card.question);
    const answer = getArabicText(card.answer);
    const category = getArabicText(card.category);

    return (
      <motion.div
        variants={{
          ...cardVariants,
          hover: {
            scale: 1.01,
            y: -2,
            transition: {
              type: 'spring',
              stiffness: 400,
              damping: 25,
            },
          },
        }}
        whileHover="hover"
        className={cn(
          'w-full max-w-[700px]',
          'flex flex-col',
          'bg-card border-border hover:border-primary rounded-xl border',
          'shadow-md hover:shadow-xl',
          'transition-all duration-200'
        )}
      >
        {/* Header with category badge */}
        <div className="flex items-start justify-between border-b border-border p-6 pb-4">
          <div className="flex-1" />
          <span className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 rounded-md px-3 py-1.5 text-sm font-medium">
            {category}
          </span>
        </div>

        {/* Question section */}
        <div className="border-b border-border p-6">
          <div className="mb-2 flex items-center justify-end gap-2">
            <span className="text-muted-foreground text-sm font-medium">السؤال</span>
            <span className="text-primary text-xl">❓</span>
          </div>
          <p className="text-foreground text-right text-xl font-bold leading-relaxed">
            {question}
          </p>
        </div>

        {/* Answer section */}
        <div className="p-6">
          <div className="mb-2 flex items-center justify-end gap-2">
            <span className="text-muted-foreground text-sm font-medium">الإجابة</span>
            <span className="text-primary text-xl">💡</span>
          </div>
          <p className="text-foreground text-right text-base leading-relaxed">
            {answer}
          </p>
        </div>
      </motion.div>
    );
  }

  // Charity card layout
  if (entityType === 'charity') {
    const name = getArabicText(card.name);
    const type = card.type;
    const typeLabel = getCategoryLabel(type);
    const amount = card.payment?.defaultAmount || card.payment?.requiredAmount;

    return (
      <motion.div
        variants={cardVariants}
        whileHover="hover"
        whileTap="tap"
        onClick={onClick}
        className={cn(
          'w-[200px]',
          'flex flex-col overflow-hidden',
          'bg-card border-border hover:border-primary rounded-xl border',
          'cursor-pointer',
          'shadow-md hover:shadow-xl',
          'transition-all duration-200'
        )}
      >
        {/* Horizontal layout: Image + Content */}
        <div className="flex gap-2 p-3">
          {/* Charity Image - 80x80px */}
          <div className="flex-shrink-0">
            <img
              src="https://placehold.co/80x80/e2e8f0/64748b?text=Charity"
              alt={name}
              className="h-[80px] w-[80px] rounded-lg object-cover"
            />
          </div>

          {/* Content */}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {/* Name */}
            <h3 className="text-foreground line-clamp-2 text-right text-sm font-bold leading-tight">
              {name}
            </h3>

            {/* Type Badge */}
            <div className="flex justify-end">
              <span className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded-md px-2 py-0.5 text-xs font-medium">
                {typeLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Amount Section */}
        {amount && (
          <div className="border-t border-border bg-muted/30 px-3 py-2">
            <div className="text-right">
              <div className="text-muted-foreground text-xs">المبلغ المقترح</div>
              <div className="text-foreground mt-0.5 text-sm font-bold" dir="rtl">{amount} ر.ق</div>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // Atonement card layout
  if (entityType === 'atonement') {
    const name = getArabicText(card.name);
    const type = card.type;
    const typeLabel = getCategoryLabel(type);
    const amount = card.payment?.requiredAmount || card.payment?.defaultAmount;

    return (
      <motion.div
        variants={cardVariants}
        whileHover="hover"
        whileTap="tap"
        onClick={onClick}
        className={cn(
          'w-[200px]',
          'flex flex-col overflow-hidden',
          'bg-card border-border hover:border-primary rounded-xl border',
          'cursor-pointer',
          'shadow-md hover:shadow-xl',
          'transition-all duration-200'
        )}
      >
        {/* Horizontal layout: Image + Content */}
        <div className="flex gap-2 p-3">
          {/* Atonement Image - 80x80px */}
          <div className="flex-shrink-0">
            <img
              src="https://placehold.co/80x80/e2e8f0/64748b?text=Atonement"
              alt={name}
              className="h-[80px] w-[80px] rounded-lg object-cover"
            />
          </div>

          {/* Content */}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            {/* Name */}
            <h3 className="text-foreground line-clamp-2 text-right text-sm font-bold leading-tight">
              {name}
            </h3>

            {/* Type Badge */}
            <div className="flex justify-end">
              <span className="bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded-md px-2 py-0.5 text-xs font-medium">
                {typeLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Amount Section */}
        {amount && (
          <div className="border-t border-border bg-muted/30 px-3 py-2">
            <div className="text-right">
              <div className="text-muted-foreground text-xs">المبلغ المقترح</div>
              <div className="text-foreground mt-0.5 text-sm font-bold" dir="rtl">{amount} ر.ق</div>
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // Fallback: Generic card layout (if entity type is unknown)
  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      className={cn(
        'h-[160px] w-[200px]',
        'flex flex-col p-4',
        'bg-card border-border hover:border-primary rounded-lg border-2',
        'cursor-pointer',
        'shadow-md hover:shadow-xl',
        'transition-all duration-200'
      )}
    >
      <h3 className="text-foreground mb-2 line-clamp-2 text-base font-semibold">{card.title}</h3>
      <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
        {card.description}
      </p>
    </motion.div>
  );
}
