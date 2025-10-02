
'use client';

import { useState, useEffect } from 'react';
import type { Order } from '@/types';
import { getPendingOrdersAction, updateOrderStatusAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Inbox, CheckCircle, PackageCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LeafLoader } from '@/components/ui/leaf-loader';

interface OrderManagementProps {
  adminUserId: string;
}

export default function OrderManagement({ adminUserId }: OrderManagementProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    const result = await getPendingOrdersAction(adminUserId);
    if (result.orders) {
      setOrders(result.orders);
    } else {
      setError(result.error || 'Failed to fetch pending orders.');
      toast({ variant: 'destructive', title: 'Error', description: result.error || 'Could not load orders.' });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [adminUserId]);
  
  const handleApproveOrder = async (orderId: string) => {
    setUpdatingId(orderId);
    const result = await updateOrderStatusAction(adminUserId, orderId, 'approved');
    if (result.success) {
        toast({ title: 'Success', description: 'Order has been approved.' });
        fetchOrders(); // Refresh the list
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to approve order.' });
    }
    setUpdatingId(null);
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <LeafLoader size={32} />
        <p className="ml-2 text-muted-foreground">Loading pending orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Failed to load orders</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-10">
        <Inbox className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <p className="text-xl font-semibold text-muted-foreground">No pending orders.</p>
        <p className="text-sm text-muted-foreground mt-1">All new orders have been processed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Table>
        <TableCaption>List of new orders awaiting approval.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Order Details</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Total</TableHead>
            <TableHead className="text-right w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell>
                <div className="font-medium">Order #{order.id.substring(0, 7)}...</div>
                <div className="text-xs text-muted-foreground">
                    {order.createdAt ? formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }) : 'Unknown date'}
                </div>
                 <Accordion type="single" collapsible className="w-full mt-2">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-xs py-1">View Details</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-xs p-2 bg-muted/50 rounded-md">
                        <strong>Shipping to:</strong>
                        <p>{order.shippingAddress.fullName}</p>
                        <p>{order.shippingAddress.addressLine1}</p>
                        {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                        <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                        <p>Phone: {order.shippingAddress.phone}</p>
                        <hr className="my-2"/>
                        <strong>Items:</strong>
                        <ul className="list-disc pl-4">
                           {order.items.map(item => (
                            <li key={item.id}>{item.name} (Qty: {item.quantity})</li>
                           ))}
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </TableCell>
              <TableCell className="text-xs">{order.shippingAddress.fullName}</TableCell>
              <TableCell>
                <Badge variant="secondary">₹{order.totalAmount.toFixed(2)}</Badge>
              </TableCell>
              <TableCell className="text-right">
                 <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => handleApproveOrder(order.id)}
                    disabled={updatingId === order.id}
                  >
                  {updatingId === order.id ? <LeafLoader size={16} className="mr-2" /> : <PackageCheck className="mr-2 h-4 w-4" />}
                  Approve
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
