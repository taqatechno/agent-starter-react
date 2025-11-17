'use client';

import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { DonationItem } from '@/components/app/new-ui/views/orders/donation-item';
import { SponsorshipItem } from '@/components/app/new-ui/views/orders/sponsorship-item';
import { OrderModal } from '@/components/app/new-ui/views/orders/order-modal';

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

export function OrdersView({ donations, sponsorships }: OrdersViewProps) {
  const [selectedOrder, setSelectedOrder] = useState<{
    type: 'donation' | 'sponsorship';
    data: DonationOrder | SponsorshipOrder;
  } | null>(null);

  // Handle order click - show modal (and prepare for future RPC)
  const handleOrderClick = (order: any, type: 'donation' | 'sponsorship') => {
    console.log(`🖱️ User clicked ${type} order:`, order.id);

    // Show modal immediately
    setSelectedOrder({ type, data: order });

    // TODO: Future implementation - send RPC to backend
    // if (!agent) return;
    // await room.localParticipant.performRpc({
    //   destinationIdentity: agent.identity,
    //   method: 'agent.selectOrder',
    //   payload: JSON.stringify({
    //     orderId: order.id,
    //     orderType: type,
    //     action: 'select'
    //   })
    // });
  };

  // Handle modal close
  const handleModalClose = () => {
    setSelectedOrder(null);
  };

  return (
    <div className="relative h-full w-full flex flex-col">
      {/* Title Section */}
      <div className="bg-background/95 backdrop-blur-sm border-b border-border p-4 z-20">
        <h2 className="text-xl font-bold text-foreground text-center">طلباتي</h2>
      </div>

      {/* Two Independent Scrollable Sections */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Donations Section - Fixed height, independently scrollable */}
        <div className="flex-1 flex flex-col border-b border-border overflow-hidden">
          <div className="bg-background/95 px-6 pt-4 pb-3">
            <h3 className="text-lg font-semibold text-right text-foreground">التبرعات</h3>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            {donations.length > 0 ? (
              <div className="space-y-2">
                {donations.map((donation) => (
                  <DonationItem
                    key={donation.id}
                    donation={donation}
                    onClick={() => handleOrderClick(donation, 'donation')}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">لا توجد تبرعات</p>
            )}
          </div>
        </div>

        {/* Sponsorships Section - Fixed height, independently scrollable */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-background/95 px-6 pt-4 pb-3">
            <h3 className="text-lg font-semibold text-right text-foreground">الكفالات</h3>
          </div>
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            {sponsorships.length > 0 ? (
              <div className="space-y-2">
                {sponsorships.map((sponsorship) => (
                  <SponsorshipItem
                    key={sponsorship.id}
                    sponsorship={sponsorship}
                    onClick={() => handleOrderClick(sponsorship, 'sponsorship')}
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">لا توجد كفالات</p>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedOrder && <OrderModal order={selectedOrder} onClose={handleModalClose} />}
      </AnimatePresence>
    </div>
  );
}
