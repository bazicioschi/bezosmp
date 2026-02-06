import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Pencil, X, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useToast } from '@/hooks/use-toast';

interface NewsCardProps {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  userId: string;
  username: string;
  avatarUrl?: string | null;
  onDelete: () => void;
  onEdit?: () => void;
}

export function NewsCard({
  id,
  title,
  content,
  imageUrl,
  createdAt,
  userId,
  username,
  avatarUrl,
  onDelete,
  onEdit,
}: NewsCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { playClick } = useSoundEffects();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editContent, setEditContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);

  const handleDelete = async () => {
    if (!user || user.id !== userId) return;
    setIsDeleting(true);
    playClick();
    await supabase.from('news').delete().eq('id', id);
    onDelete();
    setIsDeleting(false);
  };

  const handleProfileClick = () => {
    navigate(`/user/${userId}`);
  };

  const handleEdit = () => {
    setEditTitle(title);
    setEditContent(content);
    setIsEditing(true);
    playClick();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditTitle(title);
    setEditContent(content);
    playClick();
  };

  const handleSaveEdit = async () => {
    if (!user || user.id !== userId || !editTitle.trim() || !editContent.trim()) return;
    
    setIsSaving(true);
    playClick();
    
    const { error } = await supabase
      .from('news')
      .update({ title: editTitle.trim(), content: editContent.trim() })
      .eq('id', id);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update news. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'News updated',
        description: 'Your news has been updated successfully.',
      });
      setIsEditing(false);
      onEdit?.();
    }
    
    setIsSaving(false);
  };

  return (
    <article className="px-4 py-3 border-b-2 border-border hover:bg-secondary/20 transition-colors">
      <div className="flex gap-3">
        {/* Minecraft-style avatar */}
        <div 
          className="mc-slot h-11 w-11 p-0.5 cursor-pointer hover:mc-slot-active transition-all shrink-0"
          onClick={handleProfileClick}
        >
          <Avatar className="h-full w-full rounded-none">
            <AvatarImage src={avatarUrl || undefined} className="object-cover" style={{ imageRendering: 'pixelated' }} />
            <AvatarFallback className="bg-secondary text-primary mc-text text-lg rounded-none">
              {username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span 
              className="font-semibold text-foreground cursor-pointer hover:text-primary transition-colors mc-text text-lg"
              onClick={handleProfileClick}
            >
              {username}
            </span>
            <span className="text-muted-foreground text-sm">@{username.toLowerCase()}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground text-sm">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: false })}
            </span>
            {user?.id === userId && !isEditing && (
              <div className="flex items-center gap-1 ml-auto">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                  className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/20"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="minecraft-card minecraft-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="mc-text text-xl">Delete News?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this news? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="mc-btn">No, Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="mc-btn-primary bg-destructive hover:bg-destructive/90"
                      >
                        {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>

          {/* News Badge */}
          <div className="mt-2 mb-2">
            <span className="mc-slot inline-flex items-center px-2 py-0.5 mc-text text-sm text-primary">
              📰 SERVER NEWS
            </span>
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="minecraft-input"
                placeholder="News title..."
                maxLength={100}
              />
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="minecraft-input min-h-[100px] resize-none"
                placeholder="What's the news?"
                maxLength={2000}
              />
              <div className="flex items-center gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="mc-btn h-8 gap-1"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editTitle.trim() || !editContent.trim()}
                  className="mc-btn-primary h-8 gap-1"
                >
                  <Check className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="mc-text text-xl text-foreground glow-text mb-2">{title}</h3>
              <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{content}</p>
            </>
          )}

          {imageUrl && !isEditing && (
            <div className="mt-3 minecraft-card overflow-hidden">
              <img src={imageUrl} alt={title} className="w-full max-h-[400px] object-cover" />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}