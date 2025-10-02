
'use client';

import SignupForm from './components/SignupForm';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SignupPage() {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-headline tracking-tight">
            {t('signup.title')}
          </h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {t('signup.subtitle')}{' '}
            <Link href="/login" className="font-medium text-primary hover:text-primary/80">
              {t('signup.loginLink')}
            </Link>
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  );
}
