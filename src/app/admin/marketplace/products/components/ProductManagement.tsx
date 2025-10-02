
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { Product, ProductCategory } from '@/types';
import { 
    getProductsAction,
    getProductCategoriesAction,
    addProductAction,
    updateProductAction,
    deleteProductAction
} from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { AlertTriangle, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { LeafLoader } from '@/components/ui/leaf-loader';

const productFormSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters.'),
  category: z.string().min(1, 'Please select a category.'),
  price: z.coerce.number().min(0, 'Price must be a positive number.'),
  stock: z.coerce.number().int().min(0, 'Stock must be a positive integer.'),
  description: z.string().optional(),
  imageUrl: z.string().url('Please enter a valid image URL.'),
  dataAiHint: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductManagementProps {
    adminUserId: string;
}

export default function ProductManagement({ adminUserId }: ProductManagementProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      category: '',
      price: 0,
      stock: 0,
      description: '',
      imageUrl: '',
      dataAiHint: '',
    },
  });

  const fetchProductsAndCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const [productsResult, categoriesResult] = await Promise.all([
            getProductsAction(adminUserId),
            getProductCategoriesAction(adminUserId)
        ]);
        if (productsResult.products) {
            setProducts(productsResult.products);
        } else {
            setError(productsResult.error || 'Failed to load products');
        }
        if (categoriesResult.categories) {
            setCategories(categoriesResult.categories);
        } else {
            setError(error => error ? `${error}, and failed to load categories.` : 'Failed to load categories');
        }
    } catch (e: any) {
        setError(e.message || 'An unexpected error occurred.');
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
  }, [adminUserId]);

  const handleOpenDialog = (product: Product | null = null) => {
    setEditingProduct(product);
    if (product) {
      form.reset(product);
    } else {
      form.reset({
        name: '', category: '', price: 0, stock: 0, description: '', imageUrl: '', dataAiHint: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    const result = await deleteProductAction(adminUserId, productId);
    if (result.success) {
      toast({ title: 'Success', description: 'Product deleted.' });
      setProducts(prev => prev.filter(p => p.id !== productId));
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to delete product.' });
    }
  };

  const onSubmit: SubmitHandler<ProductFormValues> = async (data) => {
    setIsSubmitting(true);
    const action = editingProduct ? updateProductAction : addProductAction;
    const result = await action(adminUserId, { ...data, id: editingProduct?.id || '' });

    if (result.product) {
      toast({ title: 'Success', description: `Product ${editingProduct ? 'updated' : 'added'}.` });
      fetchProductsAndCategories();
      setIsDialogOpen(false);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsSubmitting(false);
  };
  
  if (isLoading) {
    return <div className="flex items-center justify-center py-10"><LeafLoader size={32} /></div>;
  }
  if (error) {
    return <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  }

  return (
    <div className="space-y-4">
      <div className="text-right">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update the details of this product.' : 'Fill in the details to add a new product.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="price" render={({ field }) => (
                        <FormItem><FormLabel>Price (₹)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="stock" render={({ field }) => (
                        <FormItem><FormLabel>Stock</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                      <SelectContent>{categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}</SelectContent>
                  </Select><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                  <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="dataAiHint" render={({ field }) => (
                  <FormItem><FormLabel>Image AI Hint (Optional)</FormLabel><FormControl><Input placeholder="e.g. tractor farming" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <LeafLoader size={16} className="mr-2" />}
                        {editingProduct ? 'Save Changes' : 'Add Product'}
                    </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableCaption>A list of all products in the marketplace.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium flex items-center gap-2">
                <Image src={product.imageUrl} alt={product.name} width={40} height={40} className="rounded-sm object-cover" />
                <span>{product.name}</span>
              </TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>₹{product.price.toFixed(2)}</TableCell>
              <TableCell>{product.stock}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(product)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the product "{product.name}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteProduct(product.id)}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
