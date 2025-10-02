
'use client';

import { useState, useEffect } from 'react';
import type { Order } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getUserOrdersAction } from '@/lib/actions';
import { AlertTriangle, Inbox, ListOrdered, Package, CheckCircle, Truck, XCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { LeafLoader } from '@/components/ui/leaf-loader';

const statusConfig = {
    placed: { label: "Placed", icon: Package, color: "bg-blue-500" },
    approved: { label: "Approved", icon: CheckCircle, color: "bg-yellow-500" },
    shipped: { label: "Shipped", icon: Truck, color: "bg-green-500" },
    delivered: { label: "Delivered", icon: CheckCircle, color: "bg-primary" },
    cancelled: { label: "Cancelled", icon: XCircle, color: "bg-destructive" },
};


export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!currentUser) return;

      setIsLoading(true);
      setError(null);
      const result = await getUserOrdersAction(currentUser.uid);
      if (result.orders) {
        setOrders(result.orders);
      } else {
        setError(result.error || 'Failed to fetch order history.');
      }
      setIsLoading(false);
    };

    fetchOrders();
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <LeafLoader size={32} />
        <p className="ml-2 text-muted-foreground">Loading your order history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Orders</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-10">
        <Inbox className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-xl font-semibold text-muted-foreground">No Orders Yet</p>
        <p className="text-sm text-muted-foreground mt-1">You haven't placed any orders with us.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-headline flex items-center gap-2">
        <ListOrdered className="h-6 w-6 text-primary"/>
        My Orders
      </h2>
      <div className="space-y-4">
        {orders.map((order) => {
            const StatusIcon = statusConfig[order.status]?.icon || Package;
            return (
                <div key={order.id} className="border rounded-lg p-4 space-y-4 shadow-sm">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                            <h3 className="font-semibold">Order #{order.id.substring(0, 8)}...</h3>
                            <p className="text-sm text-muted-foreground">
                                Placed on {order.createdAt ? format(new Date(order.createdAt), 'PPP') : 'N/A'}
                            </p>
                        </div>
                        <div className="text-right">
                             <Badge variant="secondary" className="capitalize flex items-center gap-1.5">
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig[order.status]?.label || order.status}
                             </Badge>
                             <p className="font-bold mt-1">₹{order.totalAmount.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                    {order.items.map(item => (
                       <div key={item.id} className="flex items-center justify-between gap-4 border-t pt-3">
                           <div className="flex items-center gap-3">
                            <Image src={item.imageUrl} alt={item.name} width={50} height={50} className="rounded-md object-cover" />
                            <div>
                                <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                                <p className="text-xs text-muted-foreground">Qty: {item.quantity} x ₹{item.price.toFixed(2)}</p>
                            </div>
                           </div>
                           <p className="font-medium text-sm">₹{(item.price * item.quantity).toFixed(2)}</p>
                       </div>
                    ))}
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}
