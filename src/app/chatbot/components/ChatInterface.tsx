
'use client';

import { useState, useRef, useEffect, type FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, User, Bot, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { saveChatMessageAction, getAgriBotResponseAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ChatMessageHistory } from '@/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();

  useEffect(() => {
    // Generate a session ID when the component mounts or when the user logs in/out
    if (currentUser) {
      setSessionId(`${currentUser.uid}-${Date.now()}`);
    } else {
      setSessionId(`guest-${Date.now()}`);
    }
  }, [currentUser]);


  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);
  
  useEffect(() => {
    // Initial bot message
    setMessages([
      { 
        id: Date.now().toString(), 
        text: t('chatbot.initialMessage'), 
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
  }, [t]);

  const handleSaveMessage = async (message: Omit<Message, 'id' | 'timestamp'>) => {
    if (!currentUser || !sessionId) {
      return;
    }

    try {
      await saveChatMessageAction({
        userId: currentUser.uid,
        sessionId: sessionId,
        text: message.text,
        sender: message.sender,
      });
    } catch (error) {
      console.error("Failed to save chat message:", error);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Login Required",
        description: "Please log in to chat with AgriBot.",
      });
      return;
    }

    const userMessageData = {
      text: inputValue,
      sender: 'user' as const,
    };
    const userMessage: Message = {
      ...userMessageData,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);
    
    await handleSaveMessage(userMessageData);

    const chatHistory: ChatMessageHistory[] = newMessages
      .filter(m => m.sender === 'user' || m.sender === 'bot')
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

    const result = await getAgriBotResponseAction({
        message: userMessage.text,
        history: chatHistory.slice(0, -1), // Send history excluding the latest user message
        language: language,
    });

    let botResponseText = "I'm sorry, I encountered an error. Please try again later.";
    if ('response' in result) {
      botResponseText = result.response;
    } else if ('error' in result) {
      botResponseText = `Error: ${result.error}`;
      console.error("AgriBot response error:", result.error);
    }

    const botResponseData = {
        text: botResponseText,
        sender: 'bot' as const,
    };
    const botResponse: Message = {
      ...botResponseData,
      id: (Date.now() + 1).toString(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, botResponse]);
    setIsLoading(false);
    await handleSaveMessage(botResponseData);
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
                {msg.sender === 'bot' ? (
                  <ReactMarkdown 
                    className="chat-prose"
                    remarkPlugins={[remarkGfm]}
                  >
                    {msg.text}
                  </ReactMarkdown>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                )}
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
      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t p-4 bg-background">
        <Input
          type="text"
          placeholder={currentUser ? t('chatbot.inputPlaceholder') : t('chatbot.inputPlaceholderLoggedOut')}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-grow"
          disabled={isLoading || !currentUser}
        />
        <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim() || !currentUser} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <Send className="h-5 w-5" />
          <span className="sr-only">{t('chatbot.send')}</span>
        </Button>
      </form>
    </div>
  );
}
