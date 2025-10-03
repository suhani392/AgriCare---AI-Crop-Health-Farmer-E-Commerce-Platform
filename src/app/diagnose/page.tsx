
'use client';
import CombinedDiagnosisChat from './components/CombinedDiagnosisChat';
import type { Metadata } from 'next';
import { useLanguage } from '@/contexts/LanguageContext';

// export const metadata: Metadata = { // Metadata can't be dynamic in client components
//   title: 'Crop Disease Diagnosis - AgriBazaar',
//   description: 'Upload an image of your crop to get an AI-powered diagnosis and treatment recommendations.',
// };

export default function DiagnosePage() {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-headline tracking-tight">{t('diagnose.pageTitle')}</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('diagnose.pageSubtitle')}
        </p>
      </header>
      <div className="w-full max-w-2xl mx-auto">
        <CombinedDiagnosisChat />
      </div>
    </div>
  );
}
