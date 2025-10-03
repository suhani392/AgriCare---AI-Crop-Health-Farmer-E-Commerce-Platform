'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Send, User, Bot, ImageIcon, AlertTriangle, UploadCloud } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessageHistory, DiagnosisResult, Product } from '@/types';
import { getAgriBotResponseAction, diagnoseCropAction } from '@/lib/actions';
import { useCart } from '@/contexts/CartContext';
import { Card, CardContent } from '@/components/ui/card';
import { getProductImage } from '@/lib/productImages';

type Sender = 'user' | 'bot';

type MessageKind = 'text' | 'suggestions';

interface ChatMessage {
  id: string;
  sender: Sender;
  kind: MessageKind;
  text: string;
  timestamp: Date;
  suggestions?: Product[];
}

export default function CombinedDiagnosisChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [attachedPreview, setAttachedPreview] = useState<string | null>(null);
  const [lastDiagnosis, setLastDiagnosis] = useState<DiagnosisResult | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const { addToCart } = useCart();

  useEffect(() => {
    setMessages([
      {
        id: `${Date.now()}`,
        sender: 'bot',
        kind: 'text',
        text: t('chatbot.initialMessage'),
        timestamp: new Date(),
      },
    ]);
  }, [t]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleAttachImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAttachedImage(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAttachedPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setAttachedPreview(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() && !attachedImage) return;

    if (!currentUser) {
      toast({ variant: 'destructive', title: t('chatbot.loginToChat'), description: t('chatbot.loginToChatDescription') });
      return;
    }

    const userText = inputValue.trim();
    const userMsg: ChatMessage = {
      id: `${Date.now()}`,
      sender: 'user',
      kind: 'text',
      text: attachedImage ? (userText ? `${userText}\n\n(Attached an image for diagnosis)` : '(Attached an image for diagnosis)') : userText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      if (attachedImage) {
        // Run diagnosis flow
        const photoDataUri = await fileToDataUri(attachedImage);
        const result = await diagnoseCropAction({
          photoDataUri,
          description: userText || 'Image provided for crop diagnosis',
          model: 'googleai/gemini-2.0-flash',
        });

        let botText = t('common.error');
        if ('error' in result) {
          botText = `Error: ${result.error}`;
        } else if (result.diagnosis) {
          const d: DiagnosisResult = result.diagnosis;
          setLastDiagnosis(d);
          botText = `Diagnosis: ${d.disease}\n\nConfidence: ${(d.confidence * 100).toFixed(0)}%\n\nRecommendations:\n\n${d.treatmentRecommendations}`;
        } else {
          botText = 'Unexpected response from diagnosis service.';
        }

        // Build product suggestions strictly from last diagnosis and recommendation text
        const suggestions: Product[] = buildProductSuggestions(lastDiagnosis, botText);

        setMessages((prev) => [
          ...prev,
          { id: `${Date.now()}-bot`, sender: 'bot', kind: 'text', text: botText, timestamp: new Date() },
          ...(suggestions.length > 0
            ? [{ id: `${Date.now()}-sugg`, sender: 'bot', kind: 'suggestions', text: '', suggestions, timestamp: new Date() }] as ChatMessage[]
            : []),
        ]);
      } else {
        // Regular chatbot Q&A
        const history: ChatMessageHistory[] = messages
          .filter((m) => m.sender === 'user' || m.sender === 'bot')
          .map((m) => ({ role: m.sender === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
        const contextualMessage = lastDiagnosis
          ? `Context: The previous diagnosis identified the disease as "${lastDiagnosis.disease}" with confidence ${(lastDiagnosis.confidence * 100).toFixed(0)}%. Provide answers that reference this context where relevant.\n\nUser: ${userText}`
          : userText;
        const result = await getAgriBotResponseAction({ message: contextualMessage, history, language });
        const botText = 'response' in result ? result.response : `Error: ${'error' in result ? result.error : 'Unknown error'}`;
        setMessages((prev) => [
          ...prev,
          { id: `${Date.now()}-bot`, sender: 'bot', kind: 'text', text: botText, timestamp: new Date() },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-err`, sender: 'bot', kind: 'text', text: err?.message || 'An unexpected error occurred.', timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
      // Reset attachment after send
      setAttachedImage(null);
      setAttachedPreview(null);
    }
  };

  const buildProductSuggestions = (diag: DiagnosisResult | null, diagnosisText: string): Product[] => {
    const items: Product[] = [];
    const base = `${diag ? diag.disease + ' ' : ''}${diagnosisText}`.toLowerCase();

    const pushItem = (id: string, name: string, category: string, price: number, description?: string) => {
      items.push({
        id,
        name,
        category,
        price,
        stock: 100,
        imageUrl: getProductImage(name),
        description,
      });
    };

    // Fungal diseases
    if (/(fung|blight|mildew|rust)/i.test(base)) {
      pushItem('fungicide-neem-1', 'Neem Oil (Fungicidal)', 'Pesticides', 299, 'Organic neem oil for fungal control');
    }
    // Insect/pest pressure (use neem as biopesticide)
    if (/(insect|aphid|borer|caterpillar|thrip|whitefly|pest)/i.test(base)) {
      pushItem('pesticide-neem-2', 'Neem Oil (Pesticidal)', 'Pesticides', 299, 'Broad-spectrum botanical pesticide');
    }
    // Weed control (glyphosate for weeds only)
    if (/(weed|weeds|grassy|grass)/i.test(base)) {
      pushItem('herbicide-glyph-1', 'Glyphosate Herbicide', 'Herbicides', 499, 'Non-selective herbicide for weed control');
    }
    // Nutrient deficiencies
    if (/(nitrogen|chlorosis|yellowing|urea)/i.test(base)) {
      pushItem('fert-urea-1', 'Urea Fertilizer', 'Fertilizers', 399, 'High nitrogen fertilizer for quick greening');
    }
    if (/(phosphorus|root vigor|dap)/i.test(base)) {
      pushItem('fert-dap-1', 'DAP Fertilizer', 'Fertilizers', 499, 'Balanced phosphorus and nitrogen for strong roots');
    }
    // Application tool only when spraying is explicitly mentioned
    if (/(spray|foliar|sprayer|sprayed)/i.test(base)) {
      pushItem('tool-sprayer-1', 'Manual Spray Pump', 'Tools', 1099, 'Handheld sprayer for field application');
    }

    return items;
  };

  return (
    <div className="flex flex-col h-full w-full bg-card border rounded-xl shadow-xl overflow-hidden">
      {!currentUser && (
        <Alert variant="destructive" className="m-4 rounded-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{t('chatbot.loginToChat')}</AlertTitle>
          <AlertDescription>
            {t('chatbot.loginToChatDescription')}
          </AlertDescription>
        </Alert>
      )}

      {attachedPreview && (
        <div className="m-4 border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-muted text-muted-foreground text-sm">
            <div className="flex items-center gap-2"><UploadCloud className="h-4 w-4"/> Attached image preview</div>
            <button
              type="button"
              className="underline"
              onClick={() => { setAttachedImage(null); setAttachedPreview(null); }}
            >Remove</button>
          </div>
          <img src={attachedPreview} alt="Attachment preview" className="max-h-64 w-full object-contain bg-background" />
        </div>
      )}

      <ScrollArea className="flex-grow p-4 sm:p-6" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn('flex items-end gap-2 max-w-[85%] sm:max-w-[75%]', msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto')}>
              <Avatar className="h-8 w-8">
                {msg.sender === 'user' ? (
                  <>
                    <AvatarImage src={currentUser?.photoURL || undefined} alt={currentUser?.displayName || 'User'} />
                    <AvatarFallback className="bg-accent text-accent-foreground"><User size={18}/></AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={18}/></AvatarFallback>
                )}
              </Avatar>
              <div className={cn('rounded-lg px-3 py-2 text-sm shadow', msg.sender === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary text-secondary-foreground rounded-bl-none')}>
                {msg.kind === 'text' && (
                  msg.sender === 'bot' ? (
                    <ReactMarkdown className="chat-prose" remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )
                )}
                {msg.kind === 'suggestions' && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="space-y-3">
                    <p className="font-semibold">Suggested products</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {msg.suggestions.map((p) => (
                        <Card key={p.id} className="overflow-hidden">
                          <CardContent className="p-3 flex gap-3 items-center">
                            <img src={p.imageUrl} alt={p.name} className="h-14 w-14 object-cover rounded" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium truncate">{p.name}</p>
                              <p className="text-xs text-muted-foreground truncate">₹{p.price}</p>
                            </div>
                            <Button size="sm" onClick={() => addToCart(p)}>Add</Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                <p className={cn('text-xs mt-1', msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-secondary-foreground/70 text-left')}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-end gap-2 max-w-[75%] mr-auto">
              <Avatar className="h-8 w-8">
                <AvatarFallback className='bg-primary text-primary-foreground'><Bot size={18}/></AvatarFallback>
              </Avatar>
              <div className="rounded-lg px-3 py-2 text-sm shadow bg-secondary text-secondary-foreground rounded-bl-none">
                <div className="flex space-x-1">
                  <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t p-4 bg-background">
        <label htmlFor="image-input" className={cn('inline-flex items-center justify-center h-10 w-10 rounded-md border cursor-pointer hover:bg-accent')}
        >
          <ImageIcon className="h-5 w-5" />
          <input id="image-input" type="file" accept="image/*" className="hidden" onChange={handleAttachImage} />
        </label>
        <Input
          type="text"
          placeholder={currentUser ? 'Ask a question or describe your crop issue...' : t('chatbot.inputPlaceholderLoggedOut')}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-grow"
          disabled={isLoading || !currentUser}
        />
        <Button type="submit" size="icon" disabled={isLoading || (!inputValue.trim() && !attachedImage) || !currentUser} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Send className="h-5 w-5" />
          <span className="sr-only">{t('chatbot.send')}</span>
        </Button>
      </form>
    </div>
  );
}


