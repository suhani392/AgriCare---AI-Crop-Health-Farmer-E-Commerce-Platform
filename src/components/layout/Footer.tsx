
'use client';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-border/40 bg-background/95">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm text-muted-foreground">
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
