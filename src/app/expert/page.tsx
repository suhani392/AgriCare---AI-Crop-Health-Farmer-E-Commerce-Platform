
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShieldAlert, MessageSquare, UserCheck } from 'lucide-react'; // Changed icon

export default function ExpertPage() {
  const { userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect if not expert and not loading.
    // If an admin lands here, they should also be able to proceed, or be redirected to /admin
    // For simplicity, we just check for 'expert' role. Admins have their own dashboard.
    if (!loading && userProfile?.role !== 'expert') {
       router.push('/'); 
    }
  }, [userProfile, loading, router]);

  if (loading) {
    return <div className="container mx-auto py-8 px-4 text-center">Loading expert dashboard...</div>;
  }

  if (userProfile?.role !== 'expert') {
    return (
      <div className="container mx-auto py-12 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Card className="w-full max-w-md text-center shadow-xl rounded-xl">
          <CardHeader>
            <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-lg">
              You do not have permission to view this page. This area is restricted to agricultural experts.
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
           <UserCheck className="h-10 w-10 text-primary"/> Expert Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">Review farmer queries and provide expert advice.</p>
      </header>
      
       <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle>Welcome, Expert!</CardTitle>
        </CardHeader>
        <CardContent>
          <p>This is your AgriBazaar expert dashboard. Farmers may request your expertise on diagnoses they are not satisfied with.</p>
          <p className="mt-4 text-sm">
            You can review and respond to these queries to help fellow farmers.
          </p>
          <div className="mt-6">
            <Button variant="default" className="w-full" asChild>
                <Link href="/admin/expert-queries"> {/* Experts use the same query management page as admins for now */}
                    <MessageSquare className="mr-2 h-5 w-5"/>
                    View & Respond to Pending Farmer Queries
                </Link>
            </Button>
          </div>
           <p className="mt-4 text-xs text-muted-foreground">
            Future enhancements may include direct communication channels and personalized recommendations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
