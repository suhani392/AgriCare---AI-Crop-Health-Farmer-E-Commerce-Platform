
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Lock } from 'lucide-react';
import { placeOrderAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { ShippingAddress } from '@/types';
import Image from 'next/image';
import { LeafLoader } from '@/components/ui/leaf-loader';

const shippingAddressSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  phone: z.string().min(10, "Please enter a valid 10-digit phone number").max(10),
  addressLine1: z.string().min(5, "Address is too short"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City name is required"),
  state: z.string().min(2, "State name is required"),
  pincode: z.string().min(6, "Please enter a valid 6-digit PIN code").max(6),
});

type ShippingFormValues = z.infer<typeof shippingAddressSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { toast } = useToast();
  
  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingAddressSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  useEffect(() => {
    if (userProfile) {
        form.setValue('fullName', userProfile.displayName || '');
    }
  }, [userProfile, form]);
  
  const {formState: { isSubmitting }} = form;

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login?redirect=/checkout');
    }
    if (!authLoading && cartItems.length === 0) {
      router.push('/products');
    }
  }, [authLoading, currentUser, cartItems, router]);

  const onSubmit = async (data: ShippingFormValues) => {
    if (!currentUser) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to place an order.' });
        return;
    }
    
    const result = await placeOrderAction({
        userId: currentUser.uid,
        items: cartItems,
        totalAmount: cartTotal,
        shippingAddress: data,
    });
    
    if (result.success && result.orderId) {
        toast({
            title: "Order Placed Successfully!",
            description: `Your order #${result.orderId} has been confirmed.`,
        });
        clearCart();
        router.push('/profile');
    } else {
        toast({
            variant: 'destructive',
            title: 'Order Failed',
            description: result.error || 'There was a problem placing your order.',
        });
    }
  };

  if (authLoading || !currentUser || cartItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <LeafLoader size={48} />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-headline">Checkout</h1>
        <p className="text-muted-foreground mt-2">
          Please provide your shipping details to complete the order.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        <div className="lg:col-span-3">
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField control={form.control} name="fullName" render={({ field }) => (
                      <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your full name" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input type="tel" placeholder="10-digit mobile number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="addressLine1" render={({ field }) => (
                    <FormItem><FormLabel>Address Line 1</FormLabel><FormControl><Input placeholder="House No., Building, Street" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                   <FormField control={form.control} name="addressLine2" render={({ field }) => (
                    <FormItem><FormLabel>Address Line 2 (Optional)</FormLabel><FormControl><Input placeholder="Apartment, suite, landmark, etc." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                     <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="e.g., Mumbai" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                     <FormField control={form.control} name="state" render={({ field }) => (
                        <FormItem><FormLabel>State</FormLabel><FormControl><Input placeholder="e.g., Maharashtra" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                     <FormField control={form.control} name="pincode" render={({ field }) => (
                        <FormItem><FormLabel>PIN Code</FormLabel><FormControl><Input placeholder="6-digit PIN code" {...field} /></FormControl><FormMessage /></FormItem>
                     )} />
                  </div>
                   <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
                    {isSubmitting ? <LeafLoader size={20} className="mr-2" /> : null}
                    Place Order (Cash on Delivery)
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
            <Card className="shadow-lg rounded-xl sticky top-20">
                <CardHeader>
                    <CardTitle>Your Order</CardTitle>
                     <CardDescription>A summary of items in your cart.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 max-h-[50vh] overflow-y-auto">
                   {cartItems.map(item => (
                       <div key={item.id} className="flex items-center justify-between gap-4 border-b pb-2 last:border-none">
                           <div className="flex items-center gap-3">
                            <Image src={item.imageUrl} alt={item.name} width={60} height={60} className="rounded-md object-cover" />
                            <div>
                                <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                                <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                           </div>
                           <p className="font-medium text-sm">₹{(item.price * item.quantity).toFixed(2)}</p>
                       </div>
                   ))}
                    <div className="border-t pt-4 space-y-2">
                         <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Subtotal</span>
                            <span>₹{cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Shipping</span>
                            <span className="font-medium text-primary">Free</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total</span>
                            <span>₹{cartTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
