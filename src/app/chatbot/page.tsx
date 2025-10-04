import ChatInterface from './components/ChatInterface';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Chat & Diagnosis - AgriCare',
  description: 'Chat with our AI assistant or upload an image to diagnose crop diseases.',
};

export default function ChatbotPage() {
  return (
    <div className="container mx-auto py-8 px-4 flex flex-col items-center" style={{ minHeight: 'calc(100vh - 8rem)' }}> {/* Adjust 8rem based on header/footer height */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-headline tracking-tight">AgriCare AI Assistant</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Ask questions or upload a photo to diagnose crop diseases.
        </p>
      </header>
      <div className="w-full max-w-2xl flex-grow flex flex-col">
        <ChatInterface />
      </div>
    </div>
  );
}
