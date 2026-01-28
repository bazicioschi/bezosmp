import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pickaxe, Lock, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formState, setFormState] = useState<'idle' | 'error' | 'success'>('idle');

  useEffect(() => {
    // Check if we have a valid session from the reset link
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User is in password recovery mode
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setFormState('error');
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      setTimeout(() => setFormState('idle'), 500);
      return;
    }

    if (password.length < 6) {
      setFormState('error');
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive',
      });
      setTimeout(() => setFormState('idle'), 500);
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setFormState('error');
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setTimeout(() => setFormState('idle'), 500);
    } else {
      setFormState('success');
      toast({ title: 'Password updated successfully!' });
      setTimeout(() => navigate('/'), 1500);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
      {/* Minecraft-style decorative blocks */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-8 h-8 bg-primary/20 border-2 border-primary/30 rotate-12 animate-float" />
        <div className="absolute bottom-20 right-20 w-6 h-6 bg-primary/10 border-2 border-primary/20 -rotate-12 animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className={`minecraft-card minecraft-border p-8 transition-all duration-300 ${
          formState === 'error' ? 'animate-shake border-destructive' : ''
        } ${formState === 'success' ? 'animate-success border-green-500' : ''}`}>
          <div className="flex flex-col items-center mb-8">
            <div className={`flex h-20 w-20 items-center justify-center rounded-none border-4 mb-4 minecraft-border ${
              formState === 'success' 
                ? 'bg-green-500/20 border-green-500/40' 
                : 'bg-primary/20 border-primary/40 animate-pulse-glow'
            }`}>
              {formState === 'success' ? (
                <CheckCircle className="h-10 w-10 text-green-500" />
              ) : (
                <Pickaxe className="h-10 w-10 text-primary" />
              )}
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground glow-text tracking-wider">
              {formState === 'success' ? 'PASSWORD UPDATED' : 'NEW PASSWORD'}
            </h1>
            <p className="text-muted-foreground mt-1 text-center text-sm">
              {formState === 'success' ? 'Redirecting you...' : 'Enter your new password below'}
            </p>
          </div>

          {formState !== 'success' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="font-display text-sm tracking-wide">NEW PASSWORD</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className={`bg-secondary/50 border-2 border-border input-glow h-12 font-body ${
                    formState === 'error' ? 'border-destructive' : ''
                  }`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="font-display text-sm tracking-wide">CONFIRM PASSWORD</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className={`bg-secondary/50 border-2 border-border input-glow h-12 font-body ${
                    formState === 'error' ? 'border-destructive' : ''
                  }`}
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
                    <Lock className="h-5 w-5 mr-2" />
                    UPDATE PASSWORD
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
