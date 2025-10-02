'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CartClient() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, cartCount, clearCart } = useCart();
  const { toast } = useToast();

  const handleClearCart = () => {
    clearCart();
    toast({
      title: "Cart Cleared",
      description: "All items have been removed from your cart.",
    });
  };

  if (cartItems.length === 0) {
    return (
      <Card className="text-center py-16 shadow-lg rounded-xl">
        <CardHeader>
          <ShoppingBag className="h-20 w-20 text-muted-foreground mx-auto mb-4" />
          <CardTitle className="text-2xl">Your Cart is Empty</CardTitle>
          <CardDescription className="mt-2 text-lg">Looks like you haven't added anything to your cart yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/products">Start Shopping</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2">
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your Items ({cartCount})</CardTitle>
            <Button variant="outline" size="sm" onClick={handleClearCart}>
              <Trash2 className="mr-2 h-4 w-4"/> Clear Cart
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] hidden sm:table-cell">Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center w-[50px]">Remove</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cartItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="hidden sm:table-cell">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={64}
                        height={64}
                        className="rounded-md object-cover"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">₹{item.price.toFixed(2)} each</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        min="1"
                        max={item.stock}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value, 10) || 1)}
                        className="w-20 mx-auto"
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.id)}>
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="shadow-lg rounded-xl sticky top-20">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Shipping</span>
              <span className="text-primary font-medium">Free</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-4">
              <span>Total</span>
              <span>₹{cartTotal.toFixed(2)}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg" asChild disabled={cartItems.length === 0}>
               <Link href="/checkout">
                Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
