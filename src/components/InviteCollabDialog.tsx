import { useState } from 'react';
import { Users } from 'lucide-react';
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

  const handleInvite = async () => {
    if (!user || !subject.trim()) return;
    setLoading(true);

    try {
      // Fetch current user's username for the message
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', user.id)
        .single();

      if (!myProfile) throw new Error('Profile not found');

      // Create the collaboration invite record
      const { data: collab, error: collabError } = await supabase
        .from('post_collaborations')
        .insert({
          inviter_id: user.id,
          invitee_id: inviteeId,
          subject: subject.trim(),
          status: 'pending',
        })
        .select()
        .single();

      if (collabError || !collab) throw collabError ?? new Error('Failed to create invite');

      // Send inbox message to invitee
      const { error: msgError } = await supabase.from('inbox_messages').insert({
        user_id: inviteeId,
        type: 'collab_invite',
        subject: `${myProfile.username} has invited you to collaborate on a post`,
        body: `Proposed subject: "${subject.trim()}"`,
        data: {
          collab_id: collab.id,
          inviter_id: user.id,
          inviter_username: myProfile.username,
          subject: subject.trim(),
        },
      });

      if (msgError) throw msgError;

      toast({ title: 'Invitation sent!', description: `${inviteeUsername} will see your invite in their inbox.` });
      setOpen(false);
      setSubject('');
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to send invitation. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.id === inviteeId) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            Invite <span className="font-semibold text-foreground">@{inviteeUsername}</span> to co-author a post with you.
            Propose a subject for the post below.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
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
          <Button onClick={handleInvite} disabled={!subject.trim() || loading} className="font-display">
            {loading ? 'Sending…' : 'Send Invite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
