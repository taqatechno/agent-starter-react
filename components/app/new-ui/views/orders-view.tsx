'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useRoomContext, useVoiceAssistant } from '@livekit/components-react';
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
  const room = useRoomContext();
  const { agent } = useVoiceAssistant();
  const [selectedOrder, setSelectedOrder] = useState<{
    type: 'donation' | 'sponsorship';
    data: DonationOrder | SponsorshipOrder;
  } | null>(null);

  // Register RPC handler for client.controlOrderModal
  useEffect(() => {
    const handleControlOrderModal = async (data: any): Promise<string> => {
      try {
        console.log('📨 Received controlOrderModal RPC:', data);

        // Parse payload (handles both string and object)
        const payload: { action: 'open' | 'close'; orderId?: string; orderType?: 'donation' | 'sponsorship' } =
          typeof data.payload === 'string' ? JSON.parse(data.payload) : data.payload;

        // Validate action field
        if (payload.action !== 'open' && payload.action !== 'close') {
          console.error('❌ Invalid action:', payload.action);
          return JSON.stringify({
            status: 'error',
            message: "Invalid action. Use 'open' or 'close'",
          });
        }

        if (payload.action === 'open') {
          // Validate orderId and orderType are provided
          if (!payload.orderId || !payload.orderType) {
            console.error('❌ Missing orderId or orderType for open action');
            return JSON.stringify({
              status: 'error',
              message: "orderId and orderType are required for 'open' action",
            });
          }

          // Find the order in the appropriate array
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

          // Open the modal
          setSelectedOrder({ type: payload.orderType, data: order });
          console.log(`✅ Opened modal for order: ${payload.orderId} of type ${payload.orderType}`);

          // Return success response
          return JSON.stringify({
            status: 'success',
            orderId: payload.orderId,
            orderType: payload.orderType,
            message: `order ${payload.orderId} of type ${payload.orderType} is open`,
          });
        } else if (payload.action === 'close') {
          // Close the modal
          setSelectedOrder(null);
          console.log('✅ Closed order modal');

          // Return success response
          return JSON.stringify({
            status: 'success',
          });
        }

        // Should never reach here due to validation
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

    // Register the RPC method
    room.localParticipant.registerRpcMethod('client.controlOrderModal', handleControlOrderModal);
    console.log('🔌 Registered RPC method: client.controlOrderModal');

    // Cleanup on unmount
    return () => {
      room.localParticipant.unregisterRpcMethod('client.controlOrderModal');
      console.log('🔌 Unregistered RPC method: client.controlOrderModal');
    };
  }, [room, donations, sponsorships]); // Include dependencies

  // Handle order click - show modal and send RPC to backend
  const handleOrderClick = async (order: any, type: 'donation' | 'sponsorship') => {
    console.log(`🖱️ User clicked ${type} order:`, order.id);

    // Show modal immediately
    setSelectedOrder({ type, data: order });

    // Send RPC to backend
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
