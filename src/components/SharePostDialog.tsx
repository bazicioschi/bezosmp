import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Send, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface SharePostDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  postId: string;
  postUsername: string;
  postSnippet: string;
  postImageUrl?: string | null;
}

interface UserRow {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

export function SharePostDialog({ open, onOpenChange, postId, postUsername, postSnippet }: SharePostDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open || !user) return;
    setSearch('');
    setSent(new Set());
    loadDefault();
  }, [open, user]);

  const loadDefault = async () => {
    if (!user) return;
    setLoading(true);
    // Recent message contacts
    const { data: msgs } = await supabase
      .from('messages')
      .select('sender_id, receiver_id')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(50);
    const ids = new Set<string>();
    msgs?.forEach(m => {
      const other = m.sender_id === user.id ? m.receiver_id : m.sender_id;
      if (other !== user.id) ids.add(other);
    });
    if (ids.size === 0) {
      // fallback: people the user follows
      const { data: f } = await supabase.from('follows').select('following_id').eq('follower_id', user.id).limit(20);
      f?.forEach(r => ids.add(r.following_id));
    }
    if (ids.size === 0) { setUsers([]); setLoading(false); return; }
    const { data: profs } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .in('user_id', Array.from(ids));
    setUsers(profs || []);
    setLoading(false);
  };

  const runSearch = async (q: string) => {
    if (!user) return;
    if (!q.trim()) return loadDefault();
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('user_id, username, avatar_url')
      .ilike('username', `%${q.trim()}%`)
      .neq('user_id', user.id)
      .limit(20);
    setUsers(data || []);
    setLoading(false);
  };

  const sharePost = async (recipient: UserRow) => {
    if (!user) return;
    setSending(recipient.user_id);
    const url = `${window.location.origin}/?post=${postId}`;
    let firstImage: string | null = null;
    if (postImageUrl) {
      try {
        if (postImageUrl.startsWith('[')) {
          const arr = JSON.parse(postImageUrl);
          firstImage = Array.isArray(arr) && arr.length ? arr[0] : null;
        } else {
          firstImage = postImageUrl;
        }
      } catch {
        firstImage = postImageUrl;
      }
    }
    const content = `📤 Shared a post by @${postUsername}:\n"${postSnippet.slice(0, 120)}${postSnippet.length > 120 ? '…' : ''}"\n${firstImage ? firstImage + '\n' : ''}${url}`;
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: recipient.user_id,
      content,
    });
    setSending(null);
    if (error) {
      toast({ title: "Couldn't send", description: error.message, variant: 'destructive' });
      return;
    }
    setSent(prev => new Set(prev).add(recipient.user_id));
    toast({ title: 'Shared', description: `Sent to @${recipient.username}` });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="mc-text">Share via chat</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); runSearch(e.target.value); }}
            placeholder="Search users..."
            className="pl-8"
          />
        </div>
        <div className="max-h-80 overflow-y-auto space-y-1">
          {loading ? (
            <div className="flex justify-center p-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center p-6">No users found</p>
          ) : (
            users.map(u => (
              <div key={u.user_id} className="flex items-center justify-between gap-2 p-2 hover:bg-muted rounded">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={u.avatar_url || undefined} />
                    <AvatarFallback>{u.username[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="mc-text text-sm truncate">@{u.username}</span>
                </div>
                <Button
                  size="sm"
                  disabled={sending === u.user_id || sent.has(u.user_id)}
                  onClick={() => sharePost(u)}
                  className="gap-1"
                >
                  {sending === u.user_id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : sent.has(u.user_id) ? (
                    'Sent'
                  ) : (
                    <><Send className="h-3 w-3" /> Send</>
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
