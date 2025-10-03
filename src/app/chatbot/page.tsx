import ChatInterface from './components/ChatInterface';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Chatbot Support - AgriBazaar',
  description: 'Get quick answers to your farming questions with our AI-powered chatbot assistant.',
};

export default function ChatbotPage() {
  return (
    <div className="container mx-auto py-8 px-4 flex flex-col items-center" style={{ minHeight: 'calc(100vh - 8rem)' }}> {/* Adjust 8rem based on header/footer height */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-headline tracking-tight">AgriBazaar Chatbot</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Ask me anything about farming, crop diseases, or our products!
        </p>
      </header>
      <div className="w-full max-w-2xl flex-grow flex flex-col">
        <ChatInterface />
      </div>
    </div>
  );
}
