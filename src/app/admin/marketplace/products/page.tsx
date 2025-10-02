
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldAlert, Package } from 'lucide-react';
import ProductManagement from './components/ProductManagement';
import { LeafLoader } from '@/components/ui/leaf-loader';

export default function ManageProductsPage() {
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
        Loading product manager...
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
              This area is restricted to administrators.
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
          <Package className="h-10 w-10 text-primary" /> Manage Products
        </h1>
        <p className="text-muted-foreground mt-2">
          Add, edit, and delete products from the marketplace.
        </p>
      </header>
      
      <Card className="shadow-lg rounded-xl">
        <CardContent className="pt-6">
          {currentUser && <ProductManagement adminUserId={currentUser.uid} />}
        </CardContent>
      </Card>
    </div>
  );
}
