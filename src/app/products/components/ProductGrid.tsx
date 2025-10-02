
'use client';

import { useState, useEffect } from 'react';
import type { Product, ProductCategory } from '@/types';
import { getProductCategoriesAction, getProductsAction } from '@/lib/actions';
import ProductCard from './ProductCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProductGrid() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoading(true);
      const [categoriesResult, productsResult] = await Promise.all([
        getProductCategoriesAction(),
        getProductsAction(),
      ]);

      if (categoriesResult.categories) {
        setCategories(categoriesResult.categories);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: categoriesResult.error || 'Could not load product categories.'
        });
      }

      if (productsResult.products) {
        setProducts(productsResult.products);
        setFilteredProducts(productsResult.products);
      } else {
         toast({
          variant: 'destructive',
          title: 'Error',
          description: productsResult.error || 'Could not load products.'
        });
      }

      setIsLoading(false);
    };
    fetchInitialData();
  }, [toast]);

  useEffect(() => {
    let productsToFilter = products;
    if (searchTerm) {
      productsToFilter = productsToFilter.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (selectedCategory !== 'All') {
      productsToFilter = productsToFilter.filter(p => p.category === selectedCategory);
    }
    setFilteredProducts(productsToFilter);
  }, [searchTerm, selectedCategory, products]);


  return (
    <div>
      <div className="mb-8 p-6 bg-secondary/30 rounded-xl shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div>
            <label htmlFor="search-product" className="block text-sm font-medium text-foreground mb-1">Search Products</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="search-product"
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-foreground mb-1">Filter by Category</label>
            <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value)}>
              <SelectTrigger id="category-filter">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="rounded-xl shadow-lg bg-card p-4 space-y-3 animate-pulse">
              <div className="aspect-square bg-muted rounded"></div>
              <div className="h-6 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
              <div className="h-16 bg-muted rounded"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
           ))}
         </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl text-muted-foreground font-semibold">No products found.</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filter criteria.</p>
        </div>
      )}
    </div>
  );
}
