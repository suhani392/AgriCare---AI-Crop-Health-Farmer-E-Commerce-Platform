
'use client';

import Image from 'next/image';
import type { Product } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tag, DollarSign, Package, ShoppingCart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "Added to Cart",
      description: `"${product.name}" has been added to your cart.`,
    });
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out transform hover:-translate-y-1">
      <CardHeader className="p-0">
        <div className="aspect-square relative w-full overflow-hidden">
          <Image 
            src={product.imageUrl} 
            alt={product.name} 
            layout="fill" 
            objectFit="cover" 
            className="transition-transform duration-500 hover:scale-105"
            data-ai-hint={product.dataAiHint || "farm product"}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-6 space-y-3">
        <CardTitle className="font-headline text-xl h-14 line-clamp-2">{product.name}</CardTitle>
        <div className="flex items-center text-sm text-muted-foreground">
          <Tag className="h-4 w-4 mr-2 text-primary" />
          <span>{product.category}</span>
        </div>
        <CardDescription className="text-sm h-20 line-clamp-4">
          {product.description || 'High-quality agricultural product.'}
        </CardDescription>
        <div className="flex items-center font-semibold text-lg text-primary">
          <DollarSign className="h-5 w-5 mr-1" />
          <span>{product.price.toFixed(2)}</span>
        </div>
        <div className="flex items-center text-xs text-muted-foreground">
            <Package className="h-3 w-3 mr-1.5"/>
            <span>{product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</span>
        </div>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button 
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" 
          disabled={product.stock === 0}
          onClick={handleAddToCart}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
        </Button>
      </CardFooter>
    </Card>
  );
}
