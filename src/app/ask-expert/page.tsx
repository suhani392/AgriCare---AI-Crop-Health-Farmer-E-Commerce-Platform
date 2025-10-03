import DirectExpertQueryForm from './components/DirectExpertQueryForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ask an Expert - AgriBazaar',
  description: 'Submit your crop query directly to an agricultural expert for analysis and advice.',
};

export default function AskExpertPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-headline tracking-tight">Ask an Expert</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Have a specific problem? Skip the AI and send your query directly to our team of agricultural experts for personalized advice.
        </p>
      </header>
      <DirectExpertQueryForm />
    </div>
  );
}
