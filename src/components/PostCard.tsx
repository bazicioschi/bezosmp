import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Trash2, Share, Bookmark, Pencil, X, Check, Edit3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
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
import { CommentSection } from './CommentSection';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useToast } from '@/hooks/use-toast';
import { ImageLightbox } from './ImageLightbox';
import { useAdmin } from '@/hooks/useAdmin';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface PostCardProps {
  id: string;
  content: string;
  imageUrl?: string | null;
  videoUrl?: string | null;
  createdAt: string;
  userId: string;
  username: string;
  avatarUrl?: string | null;
  likesCount: number;
  likesCountOverride?: number | null;
  commentsCount: number;
  isLiked: boolean;
  onLikeToggle: () => void;
  onDelete: () => void;
  onEdit?: () => void;
}

export function PostCard({
  id,
  content,
  imageUrl,
  videoUrl,
  createdAt,
  userId,
  username,
  avatarUrl,
  likesCount,
  likesCountOverride,
  commentsCount,
  isLiked,
  onLikeToggle,
  onDelete,
  onEdit,
}: PostCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { playClick, playPop, playUnpop } = useSoundEffects();
  const { canModerate } = useAdmin();
  const [showComments, setShowComments] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState(commentsCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showLikesDialog, setShowLikesDialog] = useState(false);
  const [likesOverrideInput, setLikesOverrideInput] = useState('');
  const { isAdmin } = useAdmin();

  const displayedLikes = likesCountOverride != null ? likesCountOverride : likesCount;

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'mil';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return count.toString();
  };

  const handleEditLikes = async () => {
    const value = likesOverrideInput.trim();
    const newOverride = value === '' ? null : parseInt(value, 10);
    if (value !== '' && (isNaN(newOverride!) || newOverride! < 0)) return;

    await supabase.from('posts').update({ likes_count_override: newOverride } as any).eq('id', id);
    setShowLikesDialog(false);
    onLikeToggle();
    toast({ title: 'Likes updated', description: newOverride == null ? 'Reset to actual count' : `Set to ${newOverride}` });
  };

  // Function to render content with clickable mentions
  const renderContentWithMentions = (text: string) => {
    const mentionRegex = /@(\w+)/g;
    const parts = text.split(mentionRegex);
    
    return parts.map((part, index) => {
      // Every odd index is a username (captured group)
      if (index % 2 === 1) {
        return (
          <span
            key={index}
            className="text-primary cursor-pointer hover:underline font-semibold"
            onClick={async (e) => {
              e.stopPropagation();
              // Look up user by username and navigate to their profile
              const { data } = await supabase
                .from('profiles')
                .select('user_id')
                .eq('username', part)
                .maybeSingle();
              if (data) {
                navigate(`/user/${data.user_id}`);
              }
            }}
          >
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  const handleLike = async () => {
    if (!user) return;

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    if (isLiked) {
      playUnpop();
      await supabase.from('likes').delete().eq('post_id', id).eq('user_id', user.id);
    } else {
      playPop();
      await supabase.from('likes').insert({ post_id: id, user_id: user.id });
    }
    onLikeToggle();
  };

  const handleDelete = async () => {
    if (!user || (user.id !== userId && !canModerate)) return;
    setIsDeleting(true);
    playClick();
    await supabase.from('posts').delete().eq('id', id);
    onDelete();
    setIsDeleting(false);
  };

  const handleProfileClick = () => {
    navigate(`/user/${userId}`);
  };

  const handleEdit = () => {
    setEditContent(content);
    setIsEditing(true);
    playClick();
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(content);
    playClick();
  };

  const handleSaveEdit = async () => {
    if (!user || user.id !== userId || !editContent.trim()) return;
    
    setIsSaving(true);
    playClick();
    
    const { error } = await supabase
      .from('posts')
      .update({ content: editContent.trim() })
      .eq('id', id);
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update post. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Post updated',
        description: 'Your post has been updated successfully.',
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
                      onClick={(e) => e.stopPropagation()}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="minecraft-card minecraft-border">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="mc-text text-xl">Delete Post?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this post? This action cannot be undone.
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

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="minecraft-input min-h-[80px] resize-none"
                placeholder="What's on your mind?"
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
                  disabled={isSaving || !editContent.trim()}
                  className="mc-btn-primary h-8 gap-1"
                >
                  <Check className="h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-foreground whitespace-pre-wrap break-words leading-relaxed">{renderContentWithMentions(content)}</p>
          )}

          {imageUrl && (() => {
            // Handle multiple images stored as JSON array or single image URL
            let images: string[] = [];
            try {
              if (imageUrl.startsWith('[')) {
                images = JSON.parse(imageUrl);
              } else {
                images = [imageUrl];
              }
            } catch {
              images = [imageUrl];
            }
            
            return (
              <>
                <div className={`mt-3 gap-2 ${images.length === 1 ? '' : images.length === 2 ? 'grid grid-cols-2' : 'grid grid-cols-3'}`}>
                  {images.map((img, index) => (
                    <div 
                      key={index} 
                      className="minecraft-card overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        setLightboxIndex(index);
                        setLightboxOpen(true);
                      }}
                    >
                      <img src={img} alt={`Post image ${index + 1}`} className={`w-full object-cover ${images.length === 1 ? 'max-h-[400px]' : 'aspect-square'}`} />
                    </div>
                  ))}
                </div>
                <ImageLightbox
                  images={images}
                  initialIndex={lightboxIndex}
                  isOpen={lightboxOpen}
                  onClose={() => setLightboxOpen(false)}
                />
              </>
            );
          })()}

          {videoUrl && (
            <div className="mt-3 minecraft-card overflow-hidden">
              <video 
                src={videoUrl} 
                className="w-full max-h-[400px] object-contain bg-black"
                controls
                playsInline
                webkit-playsinline="true"
                x-webkit-airplay="allow"
                preload="metadata"
                controlsList="nodownload"
                style={{ WebkitTransform: 'translateZ(0)' }}
              >
                {/* Cross-platform compatibility including iPad/iOS, Galaxy Tab, Xiaomi */}
                <source src={videoUrl} type="video/mp4; codecs=avc1.42E01E,mp4a.40.2" />
                <source src={videoUrl} type="video/mp4; codecs=avc1.64001E,mp4a.40.2" />
                <source src={videoUrl} type="video/mp4; codecs=hvc1" />
                <source src={videoUrl} type="video/mp4" />
                <source src={videoUrl} type="video/webm; codecs=vp9,opus" />
                <source src={videoUrl} type="video/webm; codecs=vp8,vorbis" />
                <source src={videoUrl} type="video/webm" />
                <source src={videoUrl} type="video/quicktime" />
                <source src={videoUrl} type="video/ogg" />
                <source src={videoUrl} type="video/3gpp" />
                <source src={videoUrl} type="video/3gpp2" />
                <source src={videoUrl} type="video/x-matroska" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          {/* Action Buttons - Minecraft Style */}
          <div className="flex items-center gap-1 mt-3 -ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); playClick(); setShowComments(!showComments); }}
              className="gap-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 px-3"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="mc-text text-sm">{localCommentsCount || ''}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); handleLike(); }}
              disabled={!user}
              className={`gap-1.5 h-8 px-3 ${isLiked ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-primary/10'}`}
            >
              <Heart 
                className={`h-4 w-4 transition-all ${isLiked ? 'fill-primary mc-heart' : ''} ${isAnimating ? 'animate-like-pop' : ''}`} 
              />
              <span className={`mc-text text-sm ${isAnimating ? 'animate-like-pop' : ''}`}>{displayedLikes || ''}</span>
            </Button>

            {isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setLikesOverrideInput(likesCountOverride != null ? String(likesCountOverride) : '');
                  setShowLikesDialog(true);
                }}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                title="Edit like count"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            )}

            {/* Quick Reactions */}
            <div className="hidden sm:flex items-center gap-0.5 ml-1">
              {['⚔️', '💎', '🔥'].map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  onClick={() => playPop()}
                  className="h-7 px-1.5 text-base hover:bg-secondary/50 hover:scale-110 transition-all"
                >
                  {emoji}
                </Button>
              ))}
            </div>

            <div className="flex-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => playClick()}
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 px-3"
            >
              <Bookmark className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => playClick()}
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 px-3"
            >
              <Share className="h-4 w-4" />
            </Button>
          </div>

          {showComments && (
            <div onClick={(e) => e.stopPropagation()} className="mt-3 pt-3 border-t border-border">
              <CommentSection 
                postId={id} 
                onCommentAdded={() => setLocalCommentsCount(prev => prev + 1)}
                onCommentDeleted={() => setLocalCommentsCount(prev => Math.max(0, prev - 1))}
              />
            </div>
          )}
        </div>
      </div>

      {/* Admin likes edit dialog */}
      <Dialog open={showLikesDialog} onOpenChange={setShowLikesDialog}>
        <DialogContent className="minecraft-card minecraft-border sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="mc-text text-xl">Edit Like Count</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Set a custom like count or leave empty to show the real count ({likesCount}).</p>
            <Input
              type="number"
              min="0"
              value={likesOverrideInput}
              onChange={(e) => setLikesOverrideInput(e.target.value)}
              placeholder={`Actual: ${likesCount}`}
              className="bg-secondary/50 border-2 border-border"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLikesDialog(false)} className="mc-btn">Cancel</Button>
            <Button onClick={handleEditLikes} className="mc-btn-primary">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}