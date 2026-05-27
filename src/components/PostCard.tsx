import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Trash2, Share, Bookmark, BookmarkCheck, Pencil, X, Check, Ban } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import { useRestrictions } from '@/hooks/useRestrictions';
import { QuickReactions } from './QuickReactions';
import { SharePostDialog } from './SharePostDialog';

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
  commentsCount: number;
  isLiked: boolean;
  onLikeToggle: () => void;
  onDelete: () => void;
  onEdit?: () => void;
  coAuthorId?: string | null;
  coAuthorUsername?: string | null;
  coAuthorAvatarUrl?: string | null;
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
  commentsCount,
  isLiked,
  onLikeToggle,
  onDelete,
  onEdit,
  coAuthorId,
  coAuthorUsername,
  coAuthorAvatarUrl,
}: PostCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { playClick, playPop, playUnpop } = useSoundEffects();
  const { canModerate } = useAdmin();
  const { isBanned, isSuspended } = useRestrictions();
  const [showComments, setShowComments] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState(commentsCount);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isSaving, setIsSaving] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [collaborators, setCollaborators] = useState<{ user_id: string; username: string; avatar_url: string | null }[]>([]);
  const [commenters, setCommenters] = useState<{ user_id: string; username: string; avatar_url: string | null }[]>([]);

  useEffect(() => {
    if (user) {
      supabase
        .from('saved_posts')
        .select('id')
        .eq('post_id', id)
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => setIsSaved(!!data));
    }
  }, [user, id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: commentRows } = await supabase
        .from('comments')
        .select('user_id')
        .eq('post_id', id)
        .limit(10);
      if (!commentRows || commentRows.length === 0) { if (!cancelled) setCommenters([]); return; }
      const uniqueIds = [...new Set(commentRows.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', uniqueIds);
      if (!cancelled) setCommenters(profiles ?? []);
    })();
    return () => { cancelled = true; };
  }, [id, localCommentsCount]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('post_collaborators')
        .select('user_id')
        .eq('post_id', id);
      if (!data || data.length === 0) { if (!cancelled) setCollaborators([]); return; }
      const { data: profs } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .in('user_id', data.map(d => d.user_id));
      if (!cancelled) setCollaborators(profs ?? []);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleSavePost = async () => {
    if (!user) return;
    playClick();
    if (isSaved) {
      await supabase.from('saved_posts').delete().eq('post_id', id).eq('user_id', user.id);
      setIsSaved(false);
    } else {
      await supabase.from('saved_posts').insert({ post_id: id, user_id: user.id });
      setIsSaved(true);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'mil';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return count.toString();
  };

  // Function to render content with clickable mentions and bz/ links
  const renderContentWithMentions = (text: string) => {
    const regex = /@(\w+)|bz\/(\S+)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      if (match[1]) {
        // @mention
        const mentionUsername = match[1];
        parts.push(
          <span
            key={match.index}
            className="text-primary cursor-pointer hover:underline font-semibold"
            onClick={async (e) => {
              e.stopPropagation();
              const { data } = await supabase
                .from('profiles')
                .select('user_id')
                .eq('username', mentionUsername)
                .maybeSingle();
              if (data) {
                navigate(`/user/${data.user_id}`);
              }
            }}
          >
            @{mentionUsername}
          </span>
        );
      } else if (match[2]) {
        // bz/subject link
        const subject = match[2];
        parts.push(
          <span
            key={match.index}
            className="text-primary cursor-pointer hover:underline font-semibold"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            bz/{subject}
          </span>
        );
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts;
  };

  const handleLike = async () => {
    if (!user || isBanned || isSuspended) return;

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
    if (!user || user.id !== userId) return;
    setIsDeleting(true);
    playClick();
    await supabase.from('posts').delete().eq('id', id);
    onDelete();
    setIsDeleting(false);
  };

  const handleBlock = async () => {
    if (!canModerate) return;
    setIsDeleting(true);
    playClick();
    await supabase.from('posts').update({ blocked: true }).eq('id', id);
    onDelete();
    setIsDeleting(false);
  };

  const handleProfileClick = () => {
    navigate(`/user/${userId}`);
  };

  const handleEdit = () => {
    if (user?.id !== userId) return;
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
            {(coAuthorId && coAuthorUsername) || collaborators.length > 0 ? (
              <span className="flex items-center gap-1 text-muted-foreground text-sm">
                <span>by</span>
                {/* post author avatar + name */}
                <span
                  className="flex items-center gap-1 cursor-pointer hover:text-primary"
                  onClick={handleProfileClick}
                >
                  <img
                    src={avatarUrl ?? `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}`}
                    alt={username}
                    className="h-5 w-5 rounded-full object-cover inline-block"
                    style={{ imageRendering: 'pixelated' }}
                  />
                  <span className="font-semibold text-foreground">@{username}</span>
                </span>
                {/* co-author from post_collaborations */}
                {coAuthorId && coAuthorUsername && (
                  <>
                    <span>and</span>
                    <span
                      className="flex items-center gap-1 cursor-pointer hover:text-primary"
                      onClick={(e) => { e.stopPropagation(); navigate(`/user/${coAuthorId}`); }}
                    >
                      <img
                        src={coAuthorAvatarUrl ?? `https://api.dicebear.com/7.x/pixel-art/svg?seed=${coAuthorUsername}`}
                        alt={coAuthorUsername}
                        className="h-5 w-5 rounded-full object-cover inline-block"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <span className="font-semibold text-foreground">@{coAuthorUsername}</span>
                    </span>
                  </>
                )}
                {/* collaborators from post_collaborators table */}
                {collaborators.map((c) => (
                  <>
                    <span key={`sep-${c.user_id}`}>and</span>
                    <span
                      key={c.user_id}
                      className="flex items-center gap-1 cursor-pointer hover:text-primary"
                      onClick={(e) => { e.stopPropagation(); navigate(`/user/${c.user_id}`); }}
                    >
                      <img
                        src={c.avatar_url ?? `https://api.dicebear.com/7.x/pixel-art/svg?seed=${c.username}`}
                        alt={c.username}
                        className="h-5 w-5 rounded-full object-cover inline-block"
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <span className="font-semibold text-foreground">@{c.username}</span>
                    </span>
                  </>
                ))}
              </span>
            ) : null}
            {!(coAuthorId || collaborators.length > 0) && (
              <span className="text-muted-foreground text-sm">@{username.toLowerCase()}</span>
            )}
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground text-sm">
              {formatDistanceToNow(new Date(createdAt), { addSuffix: false })}
            </span>
            {(user?.id === userId || canModerate) && !isEditing && (
              <div className="flex items-center gap-1 ml-auto">
                {user?.id === userId && (
                  <>
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
                  </>
                )}
                {canModerate && user?.id !== userId && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => e.stopPropagation()}
                        className="h-7 w-7 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/20"
                        title="Block post"
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="minecraft-card minecraft-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="mc-text text-xl">Block Post?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This post will be hidden from all users. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="mc-btn">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleBlock}
                          disabled={isDeleting}
                          className="mc-btn-primary bg-destructive hover:bg-destructive/90"
                        >
                          {isDeleting ? 'Blocking...' : 'Block Post'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
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

          {/* Action Buttons */}
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

            {/* Commenter avatar stack */}
            {commenters.length > 0 && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center -space-x-1.5 cursor-default px-1">
                      {commenters.slice(0, 5).map(c => (
                        <Avatar key={c.user_id} className="h-5 w-5 border border-background">
                          <AvatarImage src={c.avatar_url || undefined} style={{ imageRendering: 'pixelated' }} />
                          <AvatarFallback className="text-[8px] bg-primary/20 text-primary">{c.username.slice(0,1).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="minecraft-card p-2">
                    <div className="space-y-1.5">
                      {commenters.map(c => (
                        <div key={c.user_id} className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={c.avatar_url || undefined} style={{ imageRendering: 'pixelated' }} />
                            <AvatarFallback className="text-[8px] bg-primary/20 text-primary">{c.username.slice(0,1).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs mc-text">{c.username}</span>
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

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
              <span className={`mc-text text-sm ${isAnimating ? 'animate-like-pop' : ''}`}>{likesCount ? formatCount(likesCount) : ''}</span>
            </Button>



            {/* Quick Reactions (persistent) */}
            <div className="hidden sm:flex items-center gap-0.5 ml-1">
              <QuickReactions postId={id} compact emojis={['⚔️', '💎', '🔥']} />
            </div>

            <div className="flex-1" />

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSavePost}
              className={`hover:bg-primary/10 h-8 px-3 gap-1 mc-text ${isSaved ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
            >
              {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              <span className="text-xs">{isSaved ? 'Saved' : 'Save'}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => { playClick(); setShareOpen(true); }}
              className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 px-3"
            >
              <Share className="h-4 w-4" />
            </Button>
            <SharePostDialog
              open={shareOpen}
              onOpenChange={setShareOpen}
              postId={id}
              postUsername={username}
              postSnippet={content}
              postImageUrl={imageUrl || null}
            />
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
    </article>
  );
}