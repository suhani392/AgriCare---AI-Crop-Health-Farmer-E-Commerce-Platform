'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, User, Bot, AlertTriangle, ImagePlus, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { saveChatMessageAction, getAgriBotResponseAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ChatMessageHistory, ChatMessagePart } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

interface Message {
  id: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  parts: ChatMessagePart[];
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();

  useEffect(() => {
    if (currentUser) {
      setSessionId(`${currentUser.uid}-${Date.now()}`);
    } else {
      setSessionId(`guest-${Date.now()}`);
    }
  }, [currentUser]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  useEffect(() => {
    setMessages([
      {
        id: Date.now().toString(),
        sender: 'bot',
        timestamp: new Date(),
        parts: [{ text: t('chatbot.initialMessage') }]
      }
    ]);
  }, [t]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveMessage = async (message: Omit<Message, 'id' | 'timestamp'>) => {
    if (!currentUser || !sessionId) return;
    try {
        // Simplified for now - assuming text part exists
        const textContent = message.parts.find(p => 'text' in p)?.text || '';
        await saveChatMessageAction({
            userId: currentUser.uid,
            sessionId: sessionId,
            text: textContent, // Note: Storing only text part for history simplicity
            sender: message.sender,
        });
    } catch (error) {
        console.error("Failed to save chat message:", error);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() && !imageFile) return;

    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "Please log in to chat with AgriBot.",
      });
      return;
    }

    const userParts: ChatMessagePart[] = [];
    if (inputValue.trim()) {
        userParts.push({ text: inputValue });
    }
    if (imagePreview) {
        userParts.push({ media: { url: imagePreview } });
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      timestamp: new Date(),
      parts: userParts,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    removeImage();
    setIsLoading(true);

    // Don't save image data to history for performance
    await handleSaveMessage({ sender: 'user', parts: [{ text: inputValue }] });

    // Construct history including the current user message
    const allMessages = [...messages, userMessage];
    const chatHistory: ChatMessageHistory[] = allMessages
      .filter(m => m.sender === 'user' || m.sender === 'bot')
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: m.parts.map(part => {
          // For media parts, replace with a text reference to maintain context without sending full image data
          if ('media' in part) {
            return { text: '[User uploaded an image]' };
          }
          return part;
        }),
      }));
    
    let photoDataUri: string | undefined = undefined;
    if (imageFile) {
        photoDataUri = await fileToDataUri(imageFile);
    }

    // Debug: Log what we're sending to the AI
    console.log('=== DEBUG: Sending to AI ===');
    console.log('Message:', inputValue);
    console.log('Photo data URI present:', !!photoDataUri);
    console.log('Chat history length:', chatHistory.length);
    console.log('Chat history:', JSON.stringify(chatHistory, null, 2));

    const result = await getAgriBotResponseAction({
        message: inputValue,
        photoDataUri,
        history: chatHistory,
        language: language,
    });
    
    let botResponseText = "I'm sorry, I encountered an error. Please try again later.";
    if ('response' in result) {
      botResponseText = result.response;
    } else if ('error' in result) {
      botResponseText = `Error: ${result.error}`;
      console.error("AgriBot response error:", result.error);
    }

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'bot',
      timestamp: new Date(),
      parts: [{ text: botResponseText }],
    };
    
    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
    await handleSaveMessage({ sender: 'bot', parts: [{ text: botResponseText }] });
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
      <ScrollArea className="flex-grow p-4 sm:p-6" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex items-end gap-2 max-w-[85%] sm:max-w-[75%]",
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              )}
            >
              <Avatar className="h-8 w-8">
                {msg.sender === 'user' ? (
                  <>
                    <AvatarImage src={currentUser?.photoURL || undefined} alt={currentUser?.displayName || 'User'} />
                    <AvatarFallback className="bg-accent text-accent-foreground">
                      <User size={18}/>
                    </AvatarFallback>
                  </>
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot size={18}/>
                  </AvatarFallback>
                )}
              </Avatar>
              <div
                className={cn(
                  "rounded-lg px-3 py-2 text-sm shadow",
                  msg.sender === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-secondary text-secondary-foreground rounded-bl-none'
                )}
              >
                {msg.parts.map((part, index) => {
                  if ('text' in part && part.text) {
                    return (
                        <ReactMarkdown key={index} className="chat-prose" remarkPlugins={[remarkGfm]}>
                            {part.text}
                        </ReactMarkdown>
                    );
                  }
                  if ('media' in part) {
                    return (
                        <div key={index} className="mt-2 rounded-md overflow-hidden relative aspect-video w-full max-w-xs">
                             <Image src={part.media.url} alt="User upload" layout="fill" objectFit="contain" />
                        </div>
                    );
                  }
                  return null;
                })}
                <p className={cn(
                    "text-xs mt-1",
                    msg.sender === 'user' ? 'text-primary-foreground/70 text-right' : 'text-secondary-foreground/70 text-left'
                )}>
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
      <form onSubmit={handleSubmit} className="border-t p-4 bg-background">
        {imagePreview && (
          <div className="relative w-24 h-24 mb-2 rounded-md border overflow-hidden">
            <Image src={imagePreview} alt="Image preview" layout="fill" objectFit="cover" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6"
              onClick={removeImage}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || !currentUser}
                className="text-muted-foreground hover:text-primary"
            >
                <ImagePlus className="h-5 w-5" />
                <span className="sr-only">Add image</span>
            </Button>
            <Input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
            />
            <Input
              type="text"
              placeholder={currentUser ? t('chatbot.inputPlaceholder') : t('chatbot.inputPlaceholderLoggedOut')}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-grow"
              disabled={isLoading || !currentUser}
            />
            <Button type="submit" size="icon" disabled={isLoading || (!inputValue.trim() && !imageFile) || !currentUser} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Send className="h-5 w-5" />
              <span className="sr-only">{t('chatbot.send')}</span>
            </Button>
        </div>
      </form>
    </div>
  );
}
