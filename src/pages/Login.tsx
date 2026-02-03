import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gamepad2, LogIn, Loader2, Pickaxe, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formState, setFormState] = useState<'idle' | 'error' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormState('idle');

    const { error } = await signIn(email, password);

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
      toast({ title: 'Welcome back!' });
      setTimeout(() => navigate('/'), 300);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-secondary/20">
      {/* Minecraft-style decorative blocks */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-8 h-8 bg-primary/20 border-2 border-primary/30 rotate-12 animate-float" />
        <div className="absolute top-32 right-20 w-6 h-6 bg-primary/10 border-2 border-primary/20 -rotate-12 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-20 left-1/4 w-10 h-10 bg-secondary border-2 border-border rotate-45 animate-float" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-40 right-1/3 w-5 h-5 bg-primary/15 border-2 border-primary/25 rotate-6 animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className={`minecraft-card minecraft-border p-8 transition-all duration-300 ${
          formState === 'error' ? 'animate-shake border-destructive' : ''
        } ${formState === 'success' ? 'animate-success border-green-500' : ''}`}>
          <div className="flex flex-col items-center mb-8">
            <div className="flex h-20 w-20 items-center justify-center rounded-none bg-primary/20 border-4 border-primary/40 mb-4 animate-pulse-glow minecraft-border">
              <Pickaxe className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground glow-text tracking-wider">WELCOME BACK</h1>
            <p className="text-muted-foreground mt-1 font-display text-sm">Sign in to bezoSMP</p>
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
                className={`bg-secondary/50 border-2 border-border input-glow h-12 font-body ${
                  formState === 'error' ? 'border-destructive' : ''
                } ${formState === 'success' ? 'border-green-500' : ''}`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-display text-sm tracking-wide">PASSWORD</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`bg-secondary/50 border-2 border-border input-glow h-12 font-body pr-12 ${
                    formState === 'error' ? 'border-destructive' : ''
                  } ${formState === 'success' ? 'border-green-500' : ''}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="text-right">
              <Link 
                to="/forgot-password" 
                className="text-sm text-primary hover:text-primary/80 font-medium hover:underline transition-colors"
              >
                Forgot password?
              </Link>
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
                  <LogIn className="h-5 w-5 mr-2" />
                  SIGN IN
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:underline font-display font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
