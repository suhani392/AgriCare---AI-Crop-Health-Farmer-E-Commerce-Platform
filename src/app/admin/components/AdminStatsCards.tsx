'use client';

import { useEffect, useState } from 'react';
import type { AdminDashboardStats } from '@/types';
import { getAdminDashboardStatsAction } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, MessageSquare, Settings, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Bar, BarChart, Pie, PieChart, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

interface AdminStatsCardsProps {
  adminUserId: string;
}

export default function AdminStatsCards({ adminUserId }: AdminStatsCardsProps) {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      const result = await getAdminDashboardStatsAction(adminUserId);
      if (result.stats) {
        setStats(result.stats);
      } else {
        setError(result.error || 'An unknown error occurred while fetching stats.');
      }
      setIsLoading(false);
    };

    fetchStats();
  }, [adminUserId]);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="flex flex-col"><CardHeader><CardTitle>Total Users</CardTitle><CardDescription>Loading user data...</CardDescription></CardHeader><CardContent><Skeleton className="h-[150px] w-full" /></CardContent></Card>
        <Card className="flex flex-col"><CardHeader><CardTitle>Diagnosis Queries</CardTitle><CardDescription>Loading query data...</CardDescription></CardHeader><CardContent className="flex items-center justify-center"><Skeleton className="h-[150px] w-[150px] rounded-full" /></CardContent></Card>
        <Card><CardHeader><CardTitle>Marketplace</CardTitle><CardDescription>Loading market data...</CardDescription></CardHeader><CardContent><Skeleton className="h-8 w-1/4" /><Skeleton className="h-4 w-1/2 mt-2" /></CardContent></Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Failed to load dashboard stats</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  if (!stats) return null;

  const userRoleChartData = [
    { role: 'Farmers', count: stats.usersByRole.farmer || 0, fill: "hsl(var(--chart-1))" },
    { role: 'Experts', count: stats.usersByRole.expert || 0, fill: "hsl(var(--chart-2))" },
    { role: 'Admins', count: stats.usersByRole.admin || 0, fill: "hsl(var(--chart-5))" },
  ];
  
  const diagnosisChartData = [
    { name: 'Pending', value: stats.pendingQueries, fill: 'hsl(var(--destructive))' },
    { name: 'Reviewed', value: stats.totalDiagnoses - stats.pendingQueries, fill: 'hsl(var(--primary))' },
  ];

  const userRoleChartConfig = {
      count: { label: "Users" },
      Farmers: { label: "Farmers", color: "hsl(var(--chart-1))" },
      Experts: { label: "Experts", color: "hsl(var(--chart-2))" },
      Admins: { label: "Admins", color: "hsl(var(--chart-5))" },
  };

  const diagnosisChartConfig = {
      queries: { label: "Queries" },
      Pending: { label: "Pending", color: "hsl(var(--destructive))"},
      Reviewed: { label: "Reviewed", color: "hsl(var(--primary))"},
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users />Total Users</CardTitle>
          <CardDescription>A breakdown of all {stats.totalUsers} registered users by role.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pl-0">
          <ChartContainer config={userRoleChartConfig} className="h-[150px] w-full">
            <BarChart accessibilityLayer data={userRoleChartData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <ChartTooltip cursor={{fill: 'hsl(var(--muted)/0.3)'}} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="count" layout="vertical" radius={5}>
                     {userRoleChartData.map((entry) => (
                        <Cell key={`cell-${entry.role}`} fill={entry.fill} />
                    ))}
                </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquare />Diagnosis Queries</CardTitle>
           <CardDescription>{stats.pendingQueries} pending out of {stats.totalDiagnoses} total queries.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center pb-0">
            <ChartContainer config={diagnosisChartConfig} className="h-[150px] w-full max-w-[250px]">
                <PieChart>
                    <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                    <Pie
                        data={diagnosisChartData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={5}
                        cornerRadius={5}
                        startAngle={-90}
                        endAngle={270}
                    />
                </PieChart>
            </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings/>Marketplace</CardTitle>
          <CardDescription>Overview of the e-commerce section.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
            <div className="flex items-baseline justify-between border-b pb-2">
                <p className="text-sm text-muted-foreground">Product Categories</p>
                <p className="text-2xl font-bold">{stats.totalCategories}</p>
            </div>
            <div className="flex items-baseline justify-between">
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold text-muted-foreground">N/A</p>
            </div>
             <div className="flex items-baseline justify-between border-t pt-2">
                <p className="text-sm text-muted-foreground">Pending Orders</p>
                <p className="text-2xl font-bold text-muted-foreground">N/A</p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
