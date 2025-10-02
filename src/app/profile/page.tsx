
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import UpdateProfileForm from './components/UpdateProfileForm';
import OrderHistory from './components/OrderHistory';
import { Separator } from '@/components/ui/separator';
import { LeafLoader } from '@/components/ui/leaf-loader';

export default function ProfilePage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LeafLoader size={48} />
        <p className="mt-4 text-muted-foreground">Loading Profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-headline tracking-tight">Your Account</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Manage your profile information and view your order history.
        </p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-1">
          <UpdateProfileForm />
        </div>
        <div className="md:col-span-2">
          <OrderHistory />
        </div>
      </div>
    </div>
  );
}
