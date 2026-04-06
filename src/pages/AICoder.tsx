import { useState, useEffect, useRef } from 'react';
import { Code, Send, Loader2, Trash2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth';
import { useAdmin } from '@/hooks/useAdmin';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

type Msg = { role: 'user' | 'assistant'; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coder`;

export default function AICoder() {
  const { user } = useAuth();
  const { isAdmin, isOwner, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin && !isOwner) {
      navigate('/');
    }
  }, [isAdmin, isOwner, adminLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    let assistantSoFar = '';

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to connect to AI');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: 'assistant', content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `❌ Error: ${e.message}` }]);
    }
    setIsLoading(false);
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background mc-bedrock flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin && !isOwner) return null;

  return (
    <div className="min-h-screen bg-background mc-bedrock flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full p-4 relative z-10 flex flex-col">
        <div className="minecraft-card p-4 mb-4">
          <div className="flex items-center justify-between">
            <h1 className="mc-text text-xl text-primary glow-text flex items-center gap-2">
              <Code className="h-5 w-5" />
              AI CODER
            </h1>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setMessages([])} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-1" /> Clear
              </Button>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-1">AI coding assistant for BezoSMP admins & owners</p>
        </div>

        <div className="flex-1 minecraft-card p-4 mb-4 overflow-y-auto max-h-[60vh] space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <Code className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="mc-text">Ask me anything about coding!</p>
              <p className="text-sm mt-1">Web dev, plugins, debugging, and more.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 border border-border'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-foreground [&_pre]:bg-background [&_pre]:border [&_pre]:border-border [&_pre]:rounded [&_pre]:p-2 [&_code]:text-primary [&_pre_code]:text-foreground">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start">
              <div className="bg-secondary/50 border border-border rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="minecraft-card p-3">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a coding question..."
              className="bg-secondary/50 border-2 border-border resize-none min-h-[44px] max-h-32"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
              }}
            />
            <Button onClick={send} disabled={isLoading || !input.trim()} className="mc-btn-primary px-4 self-end">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
