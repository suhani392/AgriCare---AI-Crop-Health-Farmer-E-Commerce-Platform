
'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Save, AlertTriangle } from 'lucide-react';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { updateUserProfileAction } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LeafLoader } from '@/components/ui/leaf-loader';


const profileFormSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters.'),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function UpdateProfileForm() {
  const { currentUser, userProfile, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: userProfile?.displayName || '',
    },
    values: { // Use values to keep the form updated when profile loads
      displayName: userProfile?.displayName || '',
    }
  });

  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    if (!currentUser) {
        setError("You must be logged in to update your profile.");
        return;
    }
    
    setIsSubmitting(true);
    setError(null);
    const result = await updateUserProfileAction(currentUser.uid, data.displayName);
    if (result.success) {
      toast({
        title: "Profile Updated",
        description: "Your display name has been changed successfully.",
      });
      // Optionally force a reload of the auth context or page to reflect changes everywhere
      // For now, the optimistic update in the input is sufficient
    } else {
      setError(result.error || 'Failed to update profile.');
    }
    setIsSubmitting(false);
  };
  
  if (loading) {
    return (
        <Card className="shadow-lg rounded-xl">
            <CardHeader><CardTitle>My Profile</CardTitle></CardHeader>
            <CardContent><LeafLoader size={24} /></CardContent>
        </Card>
    )
  }

  return (
    <Card className="shadow-lg rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
            <User className="h-6 w-6 text-primary"/>
            My Profile
        </CardTitle>
        <CardDescription>Update your personal information here.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <FormLabel>Email</FormLabel>
              <Input value={userProfile?.email || ''} disabled />
              <FormDescription>Email address cannot be changed.</FormDescription>
            </FormItem>
             {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Update Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <LeafLoader size={16} className="mr-2" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
