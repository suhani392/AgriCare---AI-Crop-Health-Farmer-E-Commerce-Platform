
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldAlert, Settings } from 'lucide-react';
import CategoryManager from './components/CategoryManager';
import { LeafLoader } from '@/components/ui/leaf-loader';

export default function ManageCategoriesPage() {
  const { userProfile, loading, currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && userProfile?.role !== 'admin') {
      router.push('/'); 
    }
  }, [userProfile, loading, router]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <LeafLoader size={48} className="mb-4" />
        Loading category manager...
      </div>
    );
  }

  if (userProfile?.role !== 'admin') {
    return (
      <div className="container mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Card className="w-full max-w-md text-center shadow-xl rounded-xl">
          <CardHeader>
            <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-lg">
              You do not have permission to view this page. This area is restricted to administrators.
            </CardDescription>
            <Button asChild className="mt-6">
              <Link href="/">Go to Homepage</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
         <Link href="/admin" className="text-sm text-primary hover:underline inline-flex items-center mb-4">&larr; Back to Admin Dashboard</Link>
        <h1 className="text-4xl font-headline flex items-center gap-3">
          <Settings className="h-10 w-10 text-primary" /> Manage Product Categories
        </h1>
        <p className="text-muted-foreground mt-2">
          Add, view, and delete product categories for the marketplace.
        </p>
      </header>
      
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle>Category List</CardTitle>
          <CardDescription>These categories will be available for product filtering.</CardDescription>
        </CardHeader>
        <CardContent>
          {currentUser && <CategoryManager adminUserId={currentUser.uid} />}
        </CardContent>
      </Card>
    </div>
  );
}
