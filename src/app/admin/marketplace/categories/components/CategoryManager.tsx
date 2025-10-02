
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import type { ProductCategory } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { 
    getProductCategoriesAction,
    addProductCategoryAction,
    deleteProductCategoryAction
} from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Trash2, PlusCircle, AlertTriangle } from 'lucide-react';
import { LeafLoader } from '@/components/ui/leaf-loader';

interface CategoryManagerProps {
    adminUserId: string;
}

export default function CategoryManager({ adminUserId }: CategoryManagerProps) {
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchCategories = async () => {
        setIsLoading(true);
        setError(null);
        const result = await getProductCategoriesAction(adminUserId);
        if (result.categories) {
            setCategories(result.categories);
        } else {
            setError(result.error || 'Failed to fetch categories.');
            toast({ variant: 'destructive', title: 'Error', description: result.error || 'Could not load categories.' });
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCategories();
    }, [adminUserId]);

    const handleAddCategory = async (e: FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) {
            toast({ variant: 'destructive', title: 'Input Error', description: 'Category name cannot be empty.' });
            return;
        }

        setIsSubmitting(true);
        const result = await addProductCategoryAction(adminUserId, newCategoryName.trim());
        if (result.category) {
            toast({ title: 'Success', description: `Category "${result.category.name}" added.` });
            setCategories(prev => [...prev, result.category!].sort((a, b) => a.name.localeCompare(b.name)));
            setNewCategoryName('');
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to add category.' });
        }
        setIsSubmitting(false);
    };

    const handleDeleteCategory = async (categoryId: string) => {
        setDeletingId(categoryId);
        const result = await deleteProductCategoryAction(adminUserId, categoryId);
        if (result.success) {
            toast({ title: 'Success', description: 'Category deleted.' });
            setCategories(prev => prev.filter(cat => cat.id !== categoryId));
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to delete category.' });
        }
        setDeletingId(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-6">
                <LeafLoader size={24} />
                <p className="ml-2 text-muted-foreground">Loading categories...</p>
            </div>
        );
    }
    
    if (error) {
        return (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Failed to load data</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        );
    }

    return (
        <div className="space-y-6">
            <form onSubmit={handleAddCategory} className="flex items-center gap-2">
                <Input
                    type="text"
                    placeholder="Enter new category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    disabled={isSubmitting}
                    className="flex-grow"
                />
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <LeafLoader size={16} /> : <PlusCircle className="h-4 w-4" />}
                    <span className="ml-2 hidden sm:inline">Add</span>
                </Button>
            </form>

            <div className="border rounded-lg">
                <ul className="divide-y">
                    {categories.length > 0 ? categories.map(category => (
                        <li key={category.id} className="flex items-center justify-between p-3">
                            <span className="text-sm font-medium">{category.name}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCategory(category.id)}
                                disabled={deletingId === category.id}
                                aria-label={`Delete ${category.name}`}
                            >
                                {deletingId === category.id ? (
                                    <LeafLoader size={16} className="text-destructive" />
                                ) : (
                                    <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive" />
                                )}
                            </Button>
                        </li>
                    )) : (
                        <li className="p-4 text-center text-sm text-muted-foreground">No categories found. Add one to get started.</li>
                    )}
                </ul>
            </div>
        </div>
    );
}
