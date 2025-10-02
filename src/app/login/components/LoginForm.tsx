
'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LogIn, AlertTriangle } from 'lucide-react';
import { signInWithEmailPassword, signInWithGoogle } from '@/lib/firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { LeafLoader } from '@/components/ui/leaf-loader';
import { useLanguage } from '@/contexts/LanguageContext';

const loginFormSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

// Simple inline SVG for Google icon
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);

export default function LoginForm() {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailPassword(data.email, data.password);
      toast({
        title: t('login.toast.successTitle'),
        description: t('login.toast.successDescription'),
      });
      router.push('/'); 
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
      toast({
        variant: "destructive",
        title: t('login.toast.failTitle'),
        description: err.message || 'Please check your credentials and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      toast({
        title: t('login.toast.googleSuccessTitle'),
        description: t('login.toast.googleSuccessDescription'),
      });
      router.push('/');
    } catch (err: any) {
      // Firebase errors (like popup closed) often have a 'code' property
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google Sign-In cancelled.');
        toast({
          variant: "default",
          title: t('login.toast.googleCancelTitle'),
          description: t('login.toast.googleCancelDescription'),
        });
      } else {
        setError(err.message || 'Failed to sign in with Google. Please try again.');
        toast({
          variant: "destructive",
          title: t('login.toast.googleFailTitle'),
          description: err.message || 'An unexpected error occurred.',
        });
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card className="shadow-xl rounded-xl">
      <CardHeader>
        <CardTitle className="text-2xl">{t('login.form.title')}</CardTitle>
        <CardDescription>{t('login.form.description')}</CardDescription>
      </CardHeader>
      {error && (
        <div className="px-6 pb-0">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('login.toast.failTitle')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-2">
            <Label htmlFor="email">{t('login.form.emailLabel')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('login.form.emailPlaceholder')}
              {...register('email')}
              disabled={isLoading || isGoogleLoading}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('login.form.passwordLabel')}</Label>
            <Input
              id="password"
              type="password"
              placeholder={t('login.form.passwordPlaceholder')}
              {...register('password')}
              disabled={isLoading || isGoogleLoading}
            />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
           <Button type="submit" disabled={isLoading || isGoogleLoading} className="w-full">
            {isLoading ? <LeafLoader size={16} className="mr-2" /> : <LogIn className="mr-2 h-4 w-4" />}
            {t('login.form.loginButton')}
          </Button>
        </CardContent>
      </form>
      <div className="px-6 pb-6 space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              {t('login.form.orContinueWith')}
            </span>
          </div>
        </div>
        <Button variant="outline" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading} className="w-full">
          {isGoogleLoading ? <LeafLoader size={16} className="mr-2" /> : <GoogleIcon />}
          {t('login.form.googleButton')}
        </Button>
      </div>
    </Card>
  );
}
