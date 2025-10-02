
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldAlert, MessageSquare } from 'lucide-react';
import ExpertQueryManagement from './components/ExpertQueryManagement';
import { LeafLoader } from '@/components/ui/leaf-loader';

export default function ExpertQueriesPage() {
  const { userProfile, loading, currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'expert'))) {
      router.push('/'); // Redirect if not admin/expert and not loading
    }
  }, [userProfile, loading, router]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <LeafLoader size={48} className="mb-4" />
        Loading expert query management...
      </div>
    );
  }

  if (!userProfile || (userProfile.role !== 'admin' && userProfile.role !== 'expert')) {
    return (
      <div className="container mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Card className="w-full max-w-md text-center shadow-xl rounded-xl">
          <CardHeader>
            <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-lg">
              You do not have permission to view this page. This area is restricted to administrators and experts.
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
        <h1 className="text-4xl font-headline flex items-center gap-3">
          <MessageSquare className="h-10 w-10 text-primary" /> Manage Expert Queries
        </h1>
        <p className="text-muted-foreground mt-2">
          Review diagnosis queries flagged by users for expert assessment.
        </p>
      </header>
      
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle>Pending Reviews</CardTitle>
          <CardDescription>List of diagnosis entries awaiting expert review.</CardDescription>
        </CardHeader>
        <CardContent>
          {currentUser && <ExpertQueryManagement reviewerUserId={currentUser.uid} />}
        </CardContent>
      </Card>
    </div>
  );
}
