'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useRoomContext, useVoiceAssistant } from '@livekit/components-react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OrderModal } from '@/components/app/new-ui/views/orders/order-modal';
import { cn } from '@/lib/utils';

// Hook to detect mobile breakpoint
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    setIsMobile(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

// Type definitions based on FRONTEND_TYPES_README.md
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

interface OrdersViewProps {
  donations: DonationOrder[];
  sponsorships: SponsorshipOrder[];
}

// Helper functions - V2 schema
const getArabicText = (field: any): string => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.ar || field.en || '';
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

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

const translateDonationType = (type: string): string => {
  const translations: Record<string, string> = {
    // Main types
    project: 'مشروع',
    charity: 'صدقة',
    atonement: 'كفارة',
    general: 'عام',

    // Project sub-types
    mosque: 'مسجد',
    housing: 'إسكان',
    water: 'ماء',

    // Charity sub-types
    sadaqah: 'صدقة',
    feeding_poor: 'إطعام المساكين',
    clothes_donation: 'تبرع بالملابس',
    calamity_relief: 'إغاثة الكوارث',
    remove_affliction: 'رفع البلاء',

    // Atonement sub-types
    debtors: 'الغارمين',
    aqiqah: 'عقيقة',
    vows: 'نذور',
    purge_income: 'تطهير الدخل',
    fasting_kafara: 'كفارة الصيام',
  };
  return translations[type] || type;
};

const translatePaymentSchedule = (schedule: string): string => {
  return schedule === 'monthly' ? 'شهري' : 'مرة واحدة';
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    completed: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
    processing: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    failed: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    refunded: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

// Mobile Card Components
interface OrderCardProps {
  order: any;
  type: 'donation' | 'sponsorship';
  onClick: () => void;
}

function OrderCard({ order, type, onClick }: OrderCardProps) {
  const getItemTitle = () => {
    if (type === 'sponsorship') {
      const item = order.sponsorship_item;
      if (!item) return 'غير محدد';
      return getArabicText(item.details?.name) || 'غير محدد';
    } else {
      const item = order.donation_item;
      if (!item) return 'غير محدد';
      if (item.type === 'general') return 'تبرع عام';
      return getArabicText(item.details?.name) || 'غير محدد';
    }
  };

  const getItemCategory = () => {
    if (type === 'sponsorship') {
      const category = order.sponsorship_item?.category;
      return category ? translateCategory(category) : '';
    } else {
      const donationType = order.donation_item?.type;
      return donationType ? translateDonationType(donationType) : '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        'bg-card border-border hover:border-primary rounded-lg border p-4 cursor-pointer transition-all',
        'hover:shadow-md'
      )}
    >
      <div className="space-y-3">
        {/* Header: Title and Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-foreground text-sm font-semibold line-clamp-2 text-right">
              {getItemTitle()}
            </h3>
            {getItemCategory() && (
              <p className="text-muted-foreground text-xs mt-1 text-right">{getItemCategory()}</p>
            )}
          </div>
          <span className={cn('text-xs px-2 py-1 rounded-md whitespace-nowrap', getStatusColor(order.status))}>
            {translateStatus(order.status)}
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
          <div className="text-right">
            <div className="text-muted-foreground text-xs">المبلغ</div>
            <div className="text-foreground text-sm font-semibold">{order.amountQar} ر.ق</div>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground text-xs">الدفع</div>
            <div className="text-foreground text-sm">{translatePaymentSchedule(order.paymentSchedule)}</div>
          </div>
          <div className="text-right col-span-2">
            <div className="text-muted-foreground text-xs">التاريخ</div>
            <div className="text-foreground text-sm">{formatDate(order.createdAt)}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function OrdersView({ donations, sponsorships }: OrdersViewProps) {
  const isMobile = useIsMobile();
  const room = useRoomContext();
  const { agent } = useVoiceAssistant();
  const [selectedOrder, setSelectedOrder] = useState<{
    type: 'donation' | 'sponsorship';
    data: DonationOrder | SponsorshipOrder;
  } | null>(null);

  // Close modal when orders data changes
  useEffect(() => {
    setSelectedOrder(null);
  }, [donations, sponsorships]);

  // Column definitions for Sponsorships Table
  const sponsorshipColumns: ColumnDef<SponsorshipOrder>[] = [
    {
      accessorKey: 'name',
      header: 'الاسم',
      cell: ({ row }) => {
        const name = getArabicText(row.original.sponsorship_item?.details?.name);
        return <div className="text-right font-medium">{name || 'غير محدد'}</div>;
      },
    },
    {
      accessorKey: 'category',
      header: 'الفئة',
      cell: ({ row }) => {
        const category = row.original.sponsorship_item?.details?.category || '';
        const categoryLabel = translateCategory(category);
        return (
          <div className="text-right">
            <span className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 rounded-md px-2 py-1 text-xs font-medium">
              {categoryLabel}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'amountQar',
      header: 'المبلغ',
      cell: ({ row }) => (
        <div className="text-right">
          <div className="font-semibold">{row.original.amountQar} ر.ق</div>
          <div className="text-xs text-muted-foreground">شهري</div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => {
        const status = row.original.status;
        const statusLabel = translateStatus(status);
        const statusColor = getStatusColor(status);
        return (
          <div className="text-right">
            <span className={cn('rounded-md px-2 py-1 text-xs font-medium', statusColor)}>
              {statusLabel}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'التاريخ',
      cell: ({ row }) => (
        <div className="text-right text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</div>
      ),
    },
  ];

  // Column definitions for Donations Table
  const donationColumns: ColumnDef<DonationOrder>[] = [
    {
      accessorKey: 'name',
      header: 'اسم العنصر',
      cell: ({ row }) => {
        const name = getArabicText(row.original.donation_item?.details?.name);
        return <div className="text-right font-medium">{name || 'تبرع عام'}</div>;
      },
    },
    {
      accessorKey: 'type',
      header: 'الفئة',
      cell: ({ row }) => {
        const type = row.original.donation_item?.type || '';
        const typeLabel = translateDonationType(type);
        return (
          <div className="text-right">
            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-md px-2 py-1 text-xs font-medium">
              {typeLabel}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'amount',
      header: 'المبلغ',
      cell: ({ row }) => {
        const amount = row.original.amountQar;
        const schedule = translatePaymentSchedule(row.original.paymentSchedule);
        return (
          <div className="text-right">
            <div className="font-semibold">{amount} ر.ق</div>
            <div className="text-xs text-muted-foreground">{schedule}</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'الحالة',
      cell: ({ row }) => {
        const status = row.original.status;
        const statusLabel = translateStatus(status);
        const statusColor = getStatusColor(status);
        return (
          <div className="text-right">
            <span className={cn('rounded-md px-2 py-1 text-xs font-medium', statusColor)}>
              {statusLabel}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'التاريخ',
      cell: ({ row }) => (
        <div className="text-right text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</div>
      ),
    },
  ];

  // Initialize tables with @tanstack/react-table
  const sponsorshipTable = useReactTable({
    data: sponsorships,
    columns: sponsorshipColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const donationTable = useReactTable({
    data: donations,
    columns: donationColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Register RPC handler for client.controlOrderModal
  useEffect(() => {
    const handleControlOrderModal = async (data: any): Promise<string> => {
      try {
        console.log('📨 Received controlOrderModal RPC:', data);

        const payload: { action: 'open' | 'close'; orderId?: string; orderType?: 'donation' | 'sponsorship' } =
          typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;

        if (payload.action !== 'open' && payload.action !== 'close') {
          console.error('❌ Invalid action:', payload.action);
          return JSON.stringify({
            status: 'error',
            message: "Invalid action. Use 'open' or 'close'",
          });
        }

        if (payload.action === 'open') {
          if (!payload.orderId || !payload.orderType) {
            console.error('❌ Missing orderId or orderType for open action');
            return JSON.stringify({
              status: 'error',
              message: "orderId and orderType are required for 'open' action",
            });
          }

          let order: DonationOrder | SponsorshipOrder | undefined;
          if (payload.orderType === 'donation') {
            order = donations.find((d) => d.id === payload.orderId);
          } else if (payload.orderType === 'sponsorship') {
            order = sponsorships.find((s) => s.id === payload.orderId);
          }

          if (!order) {
            console.error(`❌ Order not found: ${payload.orderId} of type ${payload.orderType}`);
            return JSON.stringify({
              status: 'error',
              message: `no order with id ${payload.orderId} of type ${payload.orderType}`,
            });
          }

          setSelectedOrder({ type: payload.orderType, data: order });
          console.log(`✅ Opened modal for order: ${payload.orderId} of type ${payload.orderType}`);

          return JSON.stringify({
            status: 'success',
            orderId: payload.orderId,
            orderType: payload.orderType,
            message: `order ${payload.orderId} of type ${payload.orderType} is open`,
          });
        } else if (payload.action === 'close') {
          setSelectedOrder(null);
          console.log('✅ Closed order modal');

          return JSON.stringify({
            status: 'success',
          });
        }

        return JSON.stringify({
          status: 'error',
          message: 'Unknown action',
        });
      } catch (error) {
        console.error('❌ Error processing controlOrderModal:', error);
        return JSON.stringify({
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    };

    room.localParticipant.registerRpcMethod('client.controlOrderModal', handleControlOrderModal);
    console.log('🔌 Registered RPC method: client.controlOrderModal');

    return () => {
      room.localParticipant.unregisterRpcMethod('client.controlOrderModal');
      console.log('🔌 Unregistered RPC method: client.controlOrderModal');
    };
  }, [room, donations, sponsorships]);

  // Handle order click - show modal and send RPC to backend
  const handleOrderClick = async (order: any, type: 'donation' | 'sponsorship') => {
    console.log(`🖱️ User clicked ${type} order:`, order.id);

    setSelectedOrder({ type, data: order });

    if (!agent) {
      console.warn('⚠️ No agent available to send selectOrder RPC');
      return;
    }

    try {
      console.log('📤 Sending agent.selectOrder RPC...');
      const response = await room.localParticipant.performRpc({
        destinationIdentity: agent.identity,
        method: 'agent.selectOrder',
        payload: JSON.stringify({
          orderId: order.id,
          orderType: type,
          action: 'select',
        }),
      });

      console.log('✅ agent.selectOrder RPC response:', response);
    } catch (error) {
      console.error('❌ Error sending agent.selectOrder RPC:', error);
    }
  };

  const [activeTab, setActiveTab] = useState<'sponsorships' | 'donations'>('sponsorships');

  return (
    <div className="relative h-full w-full flex flex-col">
      {/* Title Section */}
      <div className="bg-background/95 backdrop-blur-sm border-b border-border p-3 z-20 md:p-4">
        <h2 className="text-lg font-bold text-foreground text-center md:text-xl">طلباتي</h2>
      </div>

      {/* Mobile: Tabs */}
      {isMobile && (
        <div className="flex border-b border-border bg-background">
          <button
            onClick={() => setActiveTab('sponsorships')}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-semibold transition-colors',
              activeTab === 'sponsorships'
                ? 'text-primary border-b-2 border-primary bg-muted/30'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            الكفالات ({sponsorships.length})
          </button>
          <button
            onClick={() => setActiveTab('donations')}
            className={cn(
              'flex-1 px-4 py-3 text-sm font-semibold transition-colors',
              activeTab === 'donations'
                ? 'text-primary border-b-2 border-primary bg-muted/30'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            التبرعات ({donations.length})
          </button>
        </div>
      )}

      {/* Content */}
      {isMobile ? (
        /* Mobile: Card view with tabs */
        <div className="flex-1 overflow-auto p-3">
          {activeTab === 'sponsorships' ? (
            <div className="space-y-3" dir="rtl">
              {sponsorships.length > 0 ? (
                sponsorships.map((sponsorship) => (
                  <OrderCard
                    key={sponsorship.id}
                    order={sponsorship}
                    type="sponsorship"
                    onClick={() => handleOrderClick(sponsorship, 'sponsorship')}
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">لا توجد كفالات</p>
              )}
            </div>
          ) : (
            <div className="space-y-3" dir="rtl">
              {donations.length > 0 ? (
                donations.map((donation) => (
                  <OrderCard
                    key={donation.id}
                    order={donation}
                    type="donation"
                    onClick={() => handleOrderClick(donation, 'donation')}
                  />
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">لا توجد تبرعات</p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Desktop: Vertically stacked tables */
        <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sponsorships Table */}
        <div className="flex flex-col border-b border-border overflow-hidden h-1/2">
          <div className="bg-background/95 px-6 pt-4 pb-3">
            <h3 className="text-lg font-semibold text-right text-foreground">الكفالات ({sponsorships.length})</h3>
          </div>
          <div className="flex-1 overflow-auto p-4" dir="rtl">
            {sponsorships.length > 0 ? (
              <Table>
                <TableHeader>
                  {sponsorshipTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {sponsorshipTable.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleOrderClick(row.original, 'sponsorship')}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-8">لا توجد كفالات</p>
            )}
          </div>
        </div>

        {/* Donations Table */}
        <div className="flex flex-col overflow-hidden h-1/2">
          <div className="bg-background/95 px-6 pt-4 pb-3">
            <h3 className="text-lg font-semibold text-right text-foreground">التبرعات ({donations.length})</h3>
          </div>
          <div className="flex-1 overflow-auto p-4" dir="rtl">
            {donations.length > 0 ? (
              <Table>
                <TableHeader>
                  {donationTable.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {donationTable.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleOrderClick(row.original, 'donation')}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground text-center py-8">لا توجد تبرعات</p>
            )}
          </div>
        </div>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {selectedOrder && <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
      </AnimatePresence>
    </div>
  );
}
