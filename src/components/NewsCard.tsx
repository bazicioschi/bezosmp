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
import { useAdmin } from '@/hooks/useAdmin';

interface NewsCardProps {
  id: string;
  title: string;
  content: string;
  imageUrl?: string | null;
  tag?: string | null;
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
  tag,
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
  const { canModerate } = useAdmin();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const [editContent, setEditContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);

  const handleDelete = async () => {
    if (!user || (user.id !== userId && !canModerate)) return;
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
    if (!user || (!canModerate && user.id !== userId) || !editTitle.trim() || !editContent.trim()) return;
    
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
            {(user?.id === userId || canModerate) && !isEditing && (
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

          {/* News Badge + Tag */}
          <div className="mt-2 mb-2 flex items-center gap-2 flex-wrap">
            <span className="mc-slot inline-flex items-center px-2 py-0.5 mc-text text-sm text-primary">
              📰 SERVER NEWS
            </span>
            {tag && (() => {
              const tagStyles: Record<string, string> = {
                announcement: 'bg-blue-500/20 text-blue-400 border border-blue-500/40',
                update: 'bg-green-500/20 text-green-400 border border-green-500/40',
                event: 'bg-purple-500/20 text-purple-400 border border-purple-500/40',
                warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40',
                'bug-fix': 'bg-red-500/20 text-red-400 border border-red-500/40',
                feature: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
              };
              return (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mc-text ${tagStyles[tag] ?? 'bg-muted text-muted-foreground border border-border'}`}>
                  {tag}
                </span>
              );
            })()}
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

          {imageUrl && !isEditing && (() => {
            // Handle multiple images stored as JSON array or single image URL
            let images: string[] = [];
            let isVideo = false;
            try {
              if (imageUrl.startsWith('[')) {
                images = JSON.parse(imageUrl);
              } else if (imageUrl.match(/\.(mp4|webm|mov|avi|mkv|ogg|3gp)(\?|$)/i)) {
                isVideo = true;
              } else {
                images = [imageUrl];
              }
            } catch {
              images = [imageUrl];
            }

            if (isVideo) {
              return (
                <div className="mt-3 minecraft-card overflow-hidden">
                  <video
                    src={imageUrl}
                    className="w-full max-h-[400px] object-contain bg-black"
                    controls
                    playsInline
                    webkit-playsinline="true"
                    x-webkit-airplay="allow"
                    preload="metadata"
                    controlsList="nodownload"
                    style={{ WebkitTransform: 'translateZ(0)' }}
                  >
                    <source src={imageUrl} type="video/mp4; codecs=avc1.42E01E,mp4a.40.2" />
                    <source src={imageUrl} type="video/mp4; codecs=avc1.64001E,mp4a.40.2" />
                    <source src={imageUrl} type="video/mp4; codecs=hvc1" />
                    <source src={imageUrl} type="video/mp4" />
                    <source src={imageUrl} type="video/webm; codecs=vp9,opus" />
                    <source src={imageUrl} type="video/webm; codecs=vp8,vorbis" />
                    <source src={imageUrl} type="video/webm" />
                    <source src={imageUrl} type="video/quicktime" />
                    <source src={imageUrl} type="video/ogg" />
                    <source src={imageUrl} type="video/3gpp" />
                    <source src={imageUrl} type="video/3gpp2" />
                    <source src={imageUrl} type="video/x-matroska" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              );
            }

            return (
              <div className={`mt-3 gap-2 ${images.length === 1 ? '' : images.length === 2 ? 'grid grid-cols-2' : 'grid grid-cols-3'}`}>
                {images.map((img, index) => (
                  <div key={index} className="minecraft-card overflow-hidden">
                    <img src={img} alt={`${title} image ${index + 1}`} className={`w-full object-cover ${images.length === 1 ? 'max-h-[400px]' : 'aspect-square'}`} />
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </article>
  );
}