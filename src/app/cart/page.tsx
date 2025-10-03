
import type { Metadata } from 'next';
import CartClient from './components/CartClient';
import { ShoppingCart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Your Shopping Cart - AgriBazaar',
  description: 'Review items in your shopping cart, adjust quantities, and proceed to checkout.',
};

export default function CartPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-4xl font-headline flex items-center gap-3">
          <ShoppingCart className="h-10 w-10 text-primary" /> Shopping Cart
        </h1>
        <p className="text-muted-foreground mt-2">
          Review your items before proceeding to checkout.
        </p>
      </header>
      <CartClient />
    </div>
  );
}
