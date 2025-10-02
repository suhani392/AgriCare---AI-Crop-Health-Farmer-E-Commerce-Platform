
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { 
    ShieldAlert, LayoutDashboard, Users, MessageSquare, Settings, 
    FileText, Package, ShoppingBasket, BookOpen, 
    Wrench, Database, ListOrdered 
} from 'lucide-react';
import UserManagementTable from './components/UserManagementTable';
import AdminStatsCards from './components/AdminStatsCards';

export default function AdminPage() {
  const { userProfile, loading, currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && userProfile?.role !== 'admin') {
       router.push('/'); // Redirect if not admin and not loading
    }
  }, [userProfile, loading, router]);

  if (loading) {
    return <div className="container mx-auto py-8 px-4 text-center">Loading admin dashboard...</div>;
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
    <div className="container mx-auto py-8 px-4 space-y-8">
      <header>
        <h1 className="text-4xl font-headline flex items-center gap-3">
            <LayoutDashboard className="h-10 w-10 text-primary"/> Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">Platform overview, user management, and system settings.</p>
      </header>
      
      <section>
        <h2 className="text-2xl font-headline mb-4">Live Platform Statistics</h2>
        {currentUser && <AdminStatsCards adminUserId={currentUser.uid} />}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-6 w-6 text-primary"/>User Management</CardTitle>
          <CardDescription>View users and manage their roles and status (active/inactive).</CardDescription>
        </CardHeader>
        <CardContent>
          {currentUser && <UserManagementTable adminUserId={currentUser.uid} />}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><ShoppingBasket className="h-6 w-6 text-primary"/>Marketplace</CardTitle>
             <CardDescription>Manage products, categories, and orders.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button variant="outline" asChild>
                  <Link href="/admin/marketplace/products"><Package className="mr-2 h-5 w-5"/>Manage Products</Link>
              </Button>
              <Button variant="outline" asChild>
                  <Link href="/admin/marketplace/categories"><Settings className="mr-2 h-5 w-5"/>Manage Categories</Link>
              </Button>
               <Button variant="outline" asChild>
                  <Link href="/admin/marketplace/orders"><ListOrdered className="mr-2 h-5 w-5"/>Approve Orders</Link>
              </Button>
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><BookOpen className="h-6 w-6 text-primary"/>Content & Queries</CardTitle>
             <CardDescription>Oversee expert interactions and platform content.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button variant="outline" asChild>
                <Link href="/admin/expert-queries"><MessageSquare className="mr-2 h-5 w-5"/>Expert Queries</Link>
              </Button>
              <Button variant="outline" disabled><FileText className="mr-2 h-5 w-5"/>Manage Articles</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2"><Wrench className="h-6 w-6 text-primary"/>System</CardTitle>
            <CardDescription>Configure system-wide settings and data.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button variant="outline" disabled><Database className="mr-2 h-5 w-5"/>Manage Seed Data</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
