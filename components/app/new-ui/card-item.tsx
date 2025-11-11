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
        <div className="mb-2 flex items-center justify-between">
          <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium">
            {categoryLabel}
          </span>
          {age && <span className="text-muted-foreground text-xs">{age} سنة</span>}
        </div>
        <h3 className="text-foreground mb-auto line-clamp-2 text-base font-semibold">{name}</h3>
        {amount && (
          <div className="text-primary text-sm font-semibold">{amount} ريال/شهر</div>
        )}
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
        <div className="mb-2">
          <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium">
            {typeLabel}
          </span>
        </div>
        <h3 className="text-foreground mb-auto line-clamp-2 text-base font-semibold">{name}</h3>
        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-muted-foreground text-xs">التمويل</span>
            <span className="text-primary text-xs font-semibold">{percentage.toFixed(0)}%</span>
          </div>
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      </motion.div>
    );
  }

  // FAQ card layout
  if (entityType === 'faq') {
    const question = getArabicText(card.question);
    const category = getArabicText(card.category);

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
        <div className="mb-2">
          <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium">
            {category}
          </span>
        </div>
        <p className="text-foreground line-clamp-4 text-sm leading-relaxed">{question}</p>
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
          'h-[160px] w-[200px]',
          'flex flex-col p-4',
          'bg-card border-border hover:border-primary rounded-lg border-2',
          'cursor-pointer',
          'shadow-md hover:shadow-xl',
          'transition-all duration-200'
        )}
      >
        <div className="mb-2">
          <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium">
            {typeLabel}
          </span>
        </div>
        <h3 className="text-foreground mb-auto line-clamp-2 text-base font-semibold">{name}</h3>
        {amount && (
          <div className="text-primary text-sm font-semibold">{amount} ريال قطري</div>
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
          'h-[160px] w-[200px]',
          'flex flex-col p-4',
          'bg-card border-border hover:border-primary rounded-lg border-2',
          'cursor-pointer',
          'shadow-md hover:shadow-xl',
          'transition-all duration-200'
        )}
      >
        <div className="mb-2">
          <span className="bg-primary/10 text-primary rounded-full px-2 py-1 text-xs font-medium">
            {typeLabel}
          </span>
        </div>
        <h3 className="text-foreground mb-auto line-clamp-2 text-base font-semibold">{name}</h3>
        {amount && (
          <div className="text-primary text-sm font-semibold">{amount} ريال قطري</div>
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
