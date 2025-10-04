
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import UpdateProfileForm from './components/UpdateProfileForm';
import OrderHistory from './components/OrderHistory';
import DiagnosisHistory from './components/DiagnosisHistory';
import { LeafLoader } from '@/components/ui/leaf-loader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, ListOrdered, Stethoscope } from 'lucide-react';


export default function ProfilePage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login?redirect=/profile');
    }
  }, [currentUser, loading, router]);

  if (loading || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
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
          Manage your profile information, view order history, and track diagnosis queries.
        </p>
      </header>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 mb-8">
          <TabsTrigger value="profile"><User className="mr-2 h-4 w-4"/>Profile</TabsTrigger>
          <TabsTrigger value="orders"><ListOrdered className="mr-2 h-4 w-4"/>Orders</TabsTrigger>
          <TabsTrigger value="diagnoses"><Stethoscope className="mr-2 h-4 w-4"/>Queries</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
            <div className="max-w-2xl mx-auto">
                <UpdateProfileForm />
            </div>
        </TabsContent>
        <TabsContent value="orders">
            <OrderHistory />
        </TabsContent>
        <TabsContent value="diagnoses">
            <DiagnosisHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}

    