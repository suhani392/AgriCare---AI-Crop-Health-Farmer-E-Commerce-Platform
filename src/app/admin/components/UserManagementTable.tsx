
'use client';

import { useState, useEffect } from 'react';
import type { UserProfile, UserRole } from '@/types';
import { fetchAllUsersAction, updateUserByAdminAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Save, UserCog, UserCheck, UserX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDistanceToNow } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LeafLoader } from '@/components/ui/leaf-loader';

interface UserManagementTableProps {
  adminUserId: string;
}

export default function UserManagementTable({ adminUserId }: UserManagementTableProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUsers, setUpdatingUsers] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    const result = await fetchAllUsersAction(adminUserId);
    if (result.users) {
      setUsers(result.users);
    } else {
      setError(result.error || 'Failed to fetch users.');
      toast({ variant: 'destructive', title: 'Error', description: result.error || 'Could not load user data.' });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [adminUserId]);

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.uid === userId ? { ...user, role: newRole } : user
      )
    );
  };

  const handleStatusChange = (userId: string, newStatus: boolean) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.uid === userId ? { ...user, status: newStatus ? 'active' : 'inactive' } : user
      )
    );
  };

  const handleSaveChanges = async (userId: string) => {
    const user = users.find(u => u.uid === userId);
    if (!user) return;

    setUpdatingUsers(prev => ({ ...prev, [userId]: true }));

    const updates = {
      role: user.role,
      status: user.status ?? 'active', // Default to active if status is undefined
    };
    
    const result = await updateUserByAdminAction(userId, updates, adminUserId);
    if (result.success) {
      toast({ title: 'Success', description: `Profile for ${user.displayName || user.email} updated.` });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error || 'Failed to update profile.' });
      // Revert changes on failure by re-fetching
      fetchUsers();
    }
    setUpdatingUsers(prev => ({ ...prev, [userId]: false }));
  };

  const roleOptions: UserRole[] = ['farmer', 'expert', 'admin'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <LeafLoader size={32} />
        <p className="ml-2 text-muted-foreground">Loading user data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Failed to load users</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (users.length === 0) {
    return <p className="text-muted-foreground">No users found in the system.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableCaption>A list of all registered users in the AgriBazaar system.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Registered</TableHead>
            <TableHead className="w-[180px]">Role</TableHead>
            <TableHead className="w-[180px]">Status</TableHead>
            <TableHead className="text-right w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isCurrentUserAdmin = user.uid === adminUserId;
            const isUserInactive = user.status === 'inactive';
            const isBeingUpdated = updatingUsers[user.uid];

            return (
            <TableRow key={user.uid} className={isUserInactive ? 'bg-muted/30' : ''}>
              <TableCell>
                <div className="font-medium">{user.displayName || 'N/A'}</div>
                <div className="text-xs text-muted-foreground">{user.uid}</div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                {user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : 'Unknown'}
              </TableCell>
              <TableCell>
                 <div className="flex items-center gap-2">
                    <Badge variant={user.role === 'admin' ? 'default' : user.role === 'expert' ? 'secondary' : 'outline'} className="capitalize">
                        {user.role === 'admin' && <ShieldCheck className="mr-1 h-3 w-3" />}
                        {user.role === 'expert' && <UserCog className="mr-1 h-3 w-3" />}
                        {user.role}
                    </Badge>
                    <Select
                    value={user.role}
                    onValueChange={(newRole) => handleRoleChange(user.uid, newRole as UserRole)}
                    disabled={isBeingUpdated || isCurrentUserAdmin}
                    >
                    <SelectTrigger className="w-[100px] h-8">
                        <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                        {roleOptions.map(role => (
                        <SelectItem key={role} value={role} className="capitalize">
                            {role}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                 </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Switch
                    id={`status-${user.uid}`}
                    checked={user.status === 'active' || user.status === undefined}
                    onCheckedChange={(checked) => handleStatusChange(user.uid, checked)}
                    disabled={isBeingUpdated || isCurrentUserAdmin}
                    aria-label="User status"
                  />
                  <Label htmlFor={`status-${user.uid}`} className="flex items-center gap-1 cursor-pointer">
                    {user.status === 'inactive' ? <UserX className="h-4 w-4 text-destructive" /> : <UserCheck className="h-4 w-4 text-green-600" />}
                    <span className={isUserInactive ? 'text-destructive' : 'text-foreground'}>
                      {isUserInactive ? 'Inactive' : 'Active'}
                    </span>
                  </Label>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  onClick={() => handleSaveChanges(user.uid)}
                  disabled={isBeingUpdated || isCurrentUserAdmin}
                  variant="outline"
                >
                  {isBeingUpdated ? (
                    <LeafLoader size={16} />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span className="ml-2 hidden sm:inline">Save</span>
                </Button>
              </TableCell>
            </TableRow>
          )})}
        </TableBody>
      </Table>
    </div>
  );
}
