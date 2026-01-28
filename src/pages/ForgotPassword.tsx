import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pickaxe, Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setSent(true);
      toast({ title: 'Reset link sent! Check your email.' });
    }

    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
        <div className="w-full max-w-md">
          <div className="minecraft-card minecraft-border p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-none bg-green-500/20 border-4 border-green-500/40 mb-6 mx-auto animate-success">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground glow-text tracking-wider mb-2">CHECK YOUR EMAIL</h1>
            <p className="text-muted-foreground mb-6">
              We've sent a password reset link to <span className="text-primary font-medium">{email}</span>
            </p>
            <Link to="/login">
              <Button variant="outline" className="minecraft-border font-display">
                <ArrowLeft className="h-4 w-4 mr-2" />
                BACK TO LOGIN
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
      {/* Minecraft-style decorative blocks */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-8 h-8 bg-primary/20 border-2 border-primary/30 rotate-12 animate-float" />
        <div className="absolute top-32 right-20 w-6 h-6 bg-primary/10 border-2 border-primary/20 -rotate-12 animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="minecraft-card minecraft-border p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-none bg-primary/20 border-4 border-primary/40 mb-4 animate-pulse-glow minecraft-border">
              <Pickaxe className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground glow-text tracking-wider">FORGOT PASSWORD</h1>
            <p className="text-muted-foreground mt-1 text-center text-sm">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-display text-sm tracking-wide">EMAIL</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="player@example.com"
                required
                className="bg-secondary/50 border-2 border-border input-glow h-12 font-body"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 font-display tracking-wider text-lg minecraft-border hover:scale-[1.02] transition-transform" 
              size="lg" 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Mail className="h-5 w-5 mr-2" />
                  SEND RESET LINK
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Remember your password?{' '}
            <Link to="/login" className="text-primary hover:underline font-display font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
