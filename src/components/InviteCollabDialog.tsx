import { useState, useRef } from 'react';
import { Users, X, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const MAX_INVITEES = 4; // 4 invitees + 1 inviter = 5 total

interface Invitee {
  user_id: string;
  username: string;
}

interface InviteCollabDialogProps {
  inviteeId: string;
  inviteeUsername: string;
}

export function InviteCollabDialog({ inviteeId, inviteeUsername }: InviteCollabDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitees, setInvitees] = useState<Invitee[]>([{ user_id: inviteeId, username: inviteeUsername }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Invitee[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<number | null>(null);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!query.trim()) { setSearchResults([]); return; }
    debounceRef.current = window.setTimeout(async () => {
      setSearching(true);
      const excluded = [user?.id ?? '', ...invitees.map(i => i.user_id)];
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username')
        .ilike('username', `${query.trim()}%`)
        .not('user_id', 'in', `(${excluded.join(',')})`)
        .limit(5);
      setSearchResults(data ?? []);
      setSearching(false);
    }, 250);
  };

  const addInvitee = (invitee: Invitee) => {
    if (invitees.length >= MAX_INVITEES) return;
    setInvitees(prev => [...prev, invitee]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeInvitee = (userId: string) => {
    if (userId === inviteeId) return; // cannot remove the preselected person
    setInvitees(prev => prev.filter(i => i.user_id !== userId));
  };

  const resetDialog = () => {
    setSubject('');
    setInvitees([{ user_id: inviteeId, username: inviteeUsername }]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleInvite = async () => {
    if (!user || !subject.trim() || invitees.length === 0) return;
    setLoading(true);

    try {
      // Fetch current user's username for the message
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single();

      if (!myProfile) throw new Error('Profile not found');

      // Insert one invite row per invitee (no session_id column needed)
      const inviteRows = invitees.map(inv => ({
        inviter_id: user.id,
        invitee_id: inv.user_id,
        subject: subject.trim(),
        status: 'pending',
      }));

      const { data: collabs, error: collabError } = await supabase
        .from('post_collaborations')
        .insert(inviteRows)
        .select();

      if (collabError || !collabs) throw collabError ?? new Error('Failed to create invites');

      // Send inbox message to every invitee
      // Include all collab IDs so CollabPost can group them
      const allCollabIds = collabs.map(c => c.id);
      const collaboratorNote = invitees.length > 1
        ? ` · ${invitees.length} collaborators invited`
        : '';
      const messages = invitees.map((inv, idx) => ({
        user_id: inv.user_id,
        type: 'collab_invite',
        subject: `${myProfile.username} has invited you to collaborate on a post`,
        body: `Proposed subject: "${subject.trim()}"${collaboratorNote}`,
        data: {
          collab_id: collabs[idx].id,
          all_collab_ids: allCollabIds,
          inviter_id: user.id,
          inviter_username: myProfile.username,
          subject: subject.trim(),
        },
      }));

      const { error: msgError } = await supabase.from('inbox_messages').insert(messages);
      if (msgError) throw msgError;

      const names = invitees.map(i => `@${i.username}`).join(', ');
      toast({ title: 'Invitation sent!', description: `Sent to: ${names}` });
      setOpen(false);
      resetDialog();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to send invitation. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.id === inviteeId) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetDialog(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full font-display gap-1">
          <Users className="h-4 w-4" />
          Collaborate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Invite to Collaborate</DialogTitle>
          <DialogDescription>
            Co-author a post with up to {MAX_INVITEES} people (including yourself that's 5 total).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Collaborators chips */}
          <div className="space-y-2">
            <Label className="font-display text-sm">
              Collaborators ({invitees.length}/{MAX_INVITEES})
            </Label>
            <div className="flex flex-wrap gap-2 min-h-[32px]">
              {invitees.map(inv => (
                <span
                  key={inv.user_id}
                  className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/30 rounded-full px-3 py-1 text-xs font-display"
                >
                  @{inv.username}
                  {inv.user_id !== inviteeId && (
                    <button
                      type="button"
                      onClick={() => removeInvitee(inv.user_id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            {/* User search to add more */}
            {invitees.length < MAX_INVITEES && (
              <div className="relative">
                <div className="flex items-center gap-2 border minecraft-border rounded-md px-3 py-2">
                  {searching ? (
                    <Loader2 className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />
                  ) : (
                    <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <input
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="Add another collaborator…"
                    value={searchQuery}
                    onChange={e => handleSearch(e.target.value)}
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md overflow-hidden">
                    {searchResults.map(r => (
                      <button
                        key={r.user_id}
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-accent text-sm text-left"
                        onClick={() => addInvitee(r)}
                      >
                        <span className="font-medium">@{r.username}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-1">
            <Label htmlFor="collab-subject" className="font-display text-sm">
              Post subject
            </Label>
            <Input
              id="collab-subject"
              placeholder="e.g. Our adventure in the Nether..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              className="minecraft-border"
              onKeyDown={(e) => { if (e.key === 'Enter' && subject.trim()) handleInvite(); }}
            />
            <p className="text-xs text-muted-foreground">{subject.length}/200</p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={!subject.trim() || loading} className="font-display gap-1.5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
            {loading ? 'Sending…' : `Send Invite${invitees.length > 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
