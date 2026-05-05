import { useState, useRef, useEffect } from 'react';
import { ImagePlus, Video, X, Send, Upload, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import { MentionInput } from './MentionInput';
import { useRestrictions } from '@/hooks/useRestrictions';
import { runAutomod } from '@/lib/automod';

interface CreatePostProps {
  onPostCreated: () => void;
}

// Supported video formats for cross-platform compatibility
const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime', // MOV (Apple)
  'video/x-msvideo', // AVI
  'video/x-matroska', // MKV
  'video/ogg',
  'video/3gpp', // Android
  'video/3gpp2',
];

const MAX_IMAGES = 10;

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { canPost } = useRestrictions();
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoPreview, setVideoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showInviteTab, setShowInviteTab] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [inviteSubject, setInviteSubject] = useState('');
  const [invitees, setInvitees] = useState<{ user_id: string; username: string; avatar_url: string | null }[]>([]);
  const [inviteSuggestions, setInviteSuggestions] = useState<{ user_id: string; username: string; avatar_url: string | null }[]>([]);
  const [showInviteSuggestions, setShowInviteSuggestions] = useState(false);
  const MAX_COLLAB_INVITEES = 9;
  const inviteInputRef = useRef<HTMLInputElement>(null);
  const inviteSuggestionsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const uploadXhrRef = useRef<XMLHttpRequest | null>(null);

  // Fetch autocomplete suggestions for invite username
  useEffect(() => {
    const query = inviteUsername.replace(/^@/, '').trim();
    if (!query) {
      setInviteSuggestions([]);
      setShowInviteSuggestions(false);
      return;
    }
    const timeout = setTimeout(async () => {
      const excluded = [user?.id ?? '', ...invitees.map(i => i.user_id)].filter(Boolean);
      const { data } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .ilike('username', `${query}%`)
        .not('user_id', 'in', `(${excluded.join(',')})`)
        .limit(6);
      setInviteSuggestions(data ?? []);
      setShowInviteSuggestions((data ?? []).length > 0);
    }, 200);
    return () => clearTimeout(timeout);
  }, [inviteUsername, user?.id, invitees]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        inviteInputRef.current && !inviteInputRef.current.contains(e.target as Node) &&
        inviteSuggestionsRef.current && !inviteSuggestionsRef.current.contains(e.target as Node)
      ) {
        setShowInviteSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    const remainingSlots = MAX_IMAGES - imageUrls.length;
    if (remainingSlots <= 0) {
      toast({
        title: 'Maximum images reached',
        description: `You can only upload up to ${MAX_IMAGES} images per post`,
        variant: 'destructive',
      });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToUpload) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: `${file.name} is not an image file`,
          variant: 'destructive',
        });
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: `${file.name} must be less than 5MB`,
          variant: 'destructive',
        });
        continue;
      }

      // Clear video if adding images
      clearVideo();
      setUploading(true);

      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, file);

      if (uploadError) {
        toast({
          title: 'Upload failed',
          description: uploadError.message,
          variant: 'destructive',
        });
        setImagePreviews(prev => prev.slice(0, -1));
      } else {
        const { data: urlData } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);
        setImageUrls(prev => [...prev, urlData.publicUrl]);
      }

      setUploading(false);
    }

    // Reset file input to allow selecting same files again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!SUPPORTED_VIDEO_TYPES.includes(file.type) && !file.type.startsWith('video/')) {
      toast({
        title: 'Error',
        description: 'Please select a valid video file (MP4, WebM, MOV, AVI, etc.)',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Video must be less than 5GB',
        variant: 'destructive',
      });
      return;
    }

    // Clear images if adding video
    clearAllImages();
    setUploading(true);
    setUploadProgress(0);

    // Create video preview
    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    // Use XMLHttpRequest for progress tracking and faster uploads
    const { data: { session } } = await supabase.auth.getSession();
    
    const uploadPromise = new Promise<{ error: Error | null }>((resolve) => {
      const xhr = new XMLHttpRequest();
      uploadXhrRef.current = xhr;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/post-videos/${fileName}`;
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(percent);
        }
      });
      
      xhr.addEventListener('load', () => {
        uploadXhrRef.current = null;
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ error: null });
        } else {
          resolve({ error: new Error(`Upload failed with status ${xhr.status}`) });
        }
      });
      
      xhr.addEventListener('error', () => {
        uploadXhrRef.current = null;
        resolve({ error: new Error('Network error during upload') });
      });
      
      xhr.addEventListener('abort', () => {
        uploadXhrRef.current = null;
        resolve({ error: new Error('Upload cancelled') });
      });
      
      xhr.open('POST', url);
      xhr.setRequestHeader('Authorization', `Bearer ${session?.access_token}`);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.setRequestHeader('x-upsert', 'true');
      xhr.send(file);
    });
    
    const { error: uploadError } = await uploadPromise;

    if (uploadError) {
      toast({
        title: 'Upload failed',
        description: uploadError.message || 'Failed to upload video',
        variant: 'destructive',
      });
      setVideoPreview('');
      URL.revokeObjectURL(previewUrl);
    } else {
      const { data: urlData } = supabase.storage
        .from('post-videos')
        .getPublicUrl(fileName);
      setVideoUrl(urlData.publicUrl);
      toast({
        title: 'Upload complete!',
        description: 'Your video has been uploaded successfully.',
      });
    }

    setUploading(false);
    setUploadProgress(0);
  };

  const cancelUpload = () => {
    if (uploadXhrRef.current) {
      uploadXhrRef.current.abort();
      uploadXhrRef.current = null;
    }
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoPreview('');
    setVideoUrl('');
    setUploading(false);
    setUploadProgress(0);
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
    toast({
      title: 'Upload cancelled',
      description: 'Video upload has been cancelled.',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || loading) return;
    const hasMedia = imageUrls.length > 0 || !!videoUrl;
    if (!content.trim() && !hasMedia) return;

    setLoading(true);
    // Store first image in image_url for backward compatibility, store all as JSON if multiple
    const { data: newPost, error } = await supabase.from('posts').insert({
      user_id: user.id,
      content: content.trim(),
      image_url: imageUrls.length > 0 ? (imageUrls.length === 1 ? imageUrls[0] : JSON.stringify(imageUrls)) : null,
      video_url: videoUrl || null,
    }).select('id').single();

    if (!error) {
      // Run automod on post content — ban if flagged
      if (content.trim()) {
        const banned = await runAutomod(user.id, content.trim());
        if (banned) {
          toast({ title: '⚠️ Post blocked', description: 'Your post contained inappropriate language. You have been temporarily banned.', variant: 'destructive' });
          // Delete the post that was just created
          if (newPost?.id) await supabase.from('posts').delete().eq('id', newPost.id);
          setContent('');
          setImageUrls([]);
          setImagePreviews([]);
          setVideoUrl('');
          setVideoPreview('');
          setLoading(false);
          return;
        }
      }
      const postInvitees = [...invitees];
      const handle = inviteUsername.replace(/^@/, '').trim();
      if (handle && !postInvitees.some(i => i.username.toLowerCase() === handle.toLowerCase())) {
        const { data: found } = await supabase.from('profiles').select('user_id, username, avatar_url').ilike('username', handle).maybeSingle();
        if (found && found.user_id !== user.id) postInvitees.push(found);
      }
      if (postInvitees.length > 0 && newPost?.id) {
        const invitedNames: string[] = [];
        for (const invitee of postInvitees) {
          const { error: inviteError } = await supabase
            .from('collab_invites')
            .insert({ post_id: newPost.id, inviter_id: user.id, invitee_id: invitee.user_id });
          if (!inviteError) {
            await supabase.from('inbox_messages').insert({
              user_id: invitee.user_id,
              type: 'collab_invite',
              subject: `${profile?.username || 'Someone'} invited you to collaborate`,
              body: content.trim().slice(0, 140),
              data: { post_id: newPost.id, inviter_id: user.id, inviter_username: profile?.username || 'Someone' },
            });
            invitedNames.push(`@${invitee.username}`);
          }
        }
        if (invitedNames.length > 0) {
          toast({ title: 'Post created and invites sent!', description: `Invited ${invitedNames.join(', ')}` });
        }
      }
      setContent('');
      setImageUrls([]);
      setImagePreviews([]);
      setVideoUrl('');
      setVideoPreview('');
      setInviteUsername('');
      setInviteSubject('');
      setInvitees([]);
      setShowInviteTab(false);
      onPostCreated();
    } else {
      toast({ title: 'Could not create post', description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const sendStandaloneInvite = async () => {
    if (!user) return;
    setLoading(true);

    // Collect invitees: chips + any typed (unresolved) username
    const finalInvitees = [...invitees];
    const handle = inviteUsername.replace(/^@/, '').trim();
    if (handle) {
      const { data: found } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .ilike('username', handle)
        .maybeSingle();
      if (!found) {
        toast({ title: 'User not found', description: `No user named @${handle}`, variant: 'destructive' });
        setLoading(false);
        return;
      }
      if (found.user_id === user.id) {
        toast({ title: 'You cannot invite yourself', variant: 'destructive' });
        setLoading(false);
        return;
      }
      if (!finalInvitees.some(i => i.user_id === found.user_id)) finalInvitees.push(found);
    }

    if (finalInvitees.length === 0) { setLoading(false); return; }

    const subject = inviteSubject.trim() || content.trim() || "Let's collaborate on a post!";
    const invitedNames: string[] = [];

    for (const invitee of finalInvitees) {
      const { data: collab, error: collabError } = await supabase
        .from('post_collaborations')
        .insert({ inviter_id: user.id, invitee_id: invitee.user_id, subject, status: 'pending' })
        .select()
        .single();
      if (collabError || !collab) continue;

      await supabase.from('inbox_messages').insert({
        user_id: invitee.user_id,
        type: 'collab_invite',
        subject: `${profile?.username || 'Someone'} wants to collaborate with you`,
        body: `Proposed subject: "${subject}"`,
        data: { collab_id: collab.id, inviter_id: user.id, inviter_username: profile?.username || 'Someone', subject },
      });
      invitedNames.push(`@${invitee.username}`);
    }

    if (invitedNames.length > 0) {
      toast({
        title: invitedNames.length === 1 ? 'Invite sent!' : `${invitedNames.length} invites sent!`,
        description: `${invitedNames.join(', ')} notified in their inbox.`,
      });
      setInviteUsername('');
      setInviteSubject('');
      setInvitees([]);
      setShowInviteTab(false);
    } else {
      toast({ title: 'Could not send invites', variant: 'destructive' });
    }
    setLoading(false);
  };

  const clearImage = (index: number) => {

    setImageUrls(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setImageUrls([]);
    setImagePreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoUrl('');
    setVideoPreview('');
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const clearMedia = () => {
    clearAllImages();
    clearVideo();
  };

  if (!user) {
    return (
      <div className="px-4 py-6 border-b-2 border-border text-center mc-dirt">
        <p className="text-muted-foreground mc-text text-lg">
          <a href="/login" className="text-primary hover:underline">LOGIN</a> TO POST
        </p>
      </div>
    );
  }

  if (!canPost) {
    return (
      <div className="px-4 py-6 border-b-2 border-border text-center space-y-1">
        <p className="text-destructive mc-text text-lg">
          ⚠️ This account has been restricted from posting.
        </p>
        <p className="text-muted-foreground text-sm">
          You are unable to create new posts. If you believe this is a mistake, please contact support.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 py-4 border-b-2 border-border">
      <div className="flex gap-3">
        <div className="mc-slot h-11 w-11 p-0.5 shrink-0">
          <Avatar className="h-full w-full rounded-none">
            <AvatarImage src={profile?.avatar_url || undefined} style={{ imageRendering: 'pixelated' }} />
            <AvatarFallback className="bg-secondary text-primary mc-text text-lg rounded-none">
              {profile?.username?.slice(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="flex-1">
          <MentionInput
            value={content}
            onChange={setContent}
            placeholder="What's happening on the server? Use @username to mention"
            className="min-h-[80px] bg-transparent border-0 resize-none text-lg placeholder:text-muted-foreground focus-visible:ring-0 p-0 mc-text"
          />

          <div className="mt-3">
            <Button
              type="button"
              variant={showInviteTab ? 'default' : 'outline'}
              onClick={() => setShowInviteTab((open) => !open)}
              className="mc-btn-primary h-9 w-full justify-center gap-2 sm:w-auto"
            >
              <UserPlus className="h-4 w-4" />
              <span className="mc-text">Invite user to colab</span>
            </Button>
            {showInviteTab && (
              <div className="mt-2 flex flex-col gap-2">
                {invitees.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {invitees.map((inv) => (
                      <span key={inv.user_id} className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs mc-text">
                        <img src={inv.avatar_url ?? `https://api.dicebear.com/7.x/pixel-art/svg?seed=${inv.username}`} alt={inv.username} className="h-4 w-4 rounded-full" />
                        @{inv.username}
                        <button type="button" onClick={() => setInvitees(prev => prev.filter(i => i.user_id !== inv.user_id))} className="ml-0.5 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <input
                    ref={inviteInputRef}
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    onFocus={() => inviteSuggestions.length > 0 && setShowInviteSuggestions(true)}
                    placeholder={invitees.length < MAX_COLLAB_INVITEES ? 'Add username…' : 'Max invitees reached'}
                    disabled={invitees.length >= MAX_COLLAB_INVITEES}
                    className="minecraft-input h-10 w-full px-3 mc-text bg-background text-foreground placeholder:text-muted-foreground disabled:opacity-50"
                  />
                  {showInviteSuggestions && (
                    <div
                      ref={inviteSuggestionsRef}
                      className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-lg"
                    >
                      {inviteSuggestions.map((s) => (
                        <button
                          key={s.user_id}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            if (invitees.length < MAX_COLLAB_INVITEES && !invitees.some(i => i.user_id === s.user_id)) {
                              setInvitees(prev => [...prev, s]);
                            }
                            setInviteUsername('');
                            setShowInviteSuggestions(false);
                          }}
                        >
                          <img
                            src={s.avatar_url ?? `https://api.dicebear.com/7.x/pixel-art/svg?seed=${s.username}`}
                            alt={s.username}
                            className="h-6 w-6 rounded-full object-cover"
                          />
                          <span className="mc-text">@{s.username}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={sendStandaloneInvite}
                  disabled={(invitees.length === 0 && !inviteUsername.trim()) || loading}
                  className="mc-btn-primary h-10"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send invite
                </Button>
                {(inviteUsername || invitees.length > 0) && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setInviteUsername(''); setInviteSubject(''); setInvitees([]); }}
                    className="mc-btn h-10"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                )}
                </div>
                <input
                  value={inviteSubject}
                  onChange={(e) => setInviteSubject(e.target.value)}
                  placeholder="Add subject"
                  maxLength={200}
                  className="minecraft-input h-10 w-full px-3 mc-text bg-background text-foreground placeholder:text-muted-foreground"
                />
              </div>
            )}
            {showInviteTab && (
              <p className="mt-1 text-xs text-muted-foreground mc-text">
                Tip: "Send invite" notifies the user instantly. Or write a post + invite — they'll be added as collaborator when they accept.
              </p>
            )}
          </div>

          {imagePreviews.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground mc-text">
                  {imagePreviews.length}/{MAX_IMAGES} images
                </span>
                {imagePreviews.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-muted-foreground hover:text-destructive"
                    onClick={clearAllImages}
                  >
                    Clear all
                  </Button>
                )}
              </div>
              <div className={`grid gap-2 ${imagePreviews.length === 1 ? 'grid-cols-1' : imagePreviews.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative minecraft-card overflow-hidden aspect-square">
                    <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 mc-slot hover:mc-slot-active"
                      onClick={() => clearImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              {uploading && (
                <div className="bg-background/80 flex items-center justify-center gap-3 p-2 rounded">
                  <Upload className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-sm mc-text text-primary">Uploading...</span>
                </div>
              )}
            </div>
          )}

          {(videoPreview || videoUrl) && (
            <div className="relative mt-3 minecraft-card overflow-hidden">
              <video 
                src={videoPreview || videoUrl} 
                className="w-full max-h-64 object-contain bg-black"
                controls
                playsInline
                preload="metadata"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 mc-slot hover:mc-slot-active"
                onClick={clearVideo}
              >
                <X className="h-4 w-4" />
              </Button>
              {uploading && (
                <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center gap-3 p-4">
                  <Upload className="h-8 w-8 text-primary animate-pulse" />
                  <div className="w-full max-w-xs">
                    <Progress value={uploadProgress} className="h-3" />
                    <p className="text-center mt-2 mc-text text-sm text-primary">{uploadProgress}% uploaded</p>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={cancelUpload}
                      className="mt-3 w-full mc-btn"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel Upload
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="post-image-upload"
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*,.mp4,.webm,.mov,.avi,.mkv,.ogg,.3gp"
                onChange={handleVideoUpload}
                className="hidden"
                id="post-video-upload"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-primary hover:bg-primary/10 mc-slot hover:mc-slot-active"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !!videoUrl || !!videoPreview || imageUrls.length >= MAX_IMAGES}
              >
                <ImagePlus className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`h-9 w-9 text-primary hover:bg-primary/10 mc-slot hover:mc-slot-active ${imageUrls.length >= MAX_IMAGES ? 'opacity-50' : ''}`}
                onClick={() => videoInputRef.current?.click()}
                disabled={uploading || imageUrls.length > 0}
              >
                <Video className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <span className="mc-text text-sm text-muted-foreground">
                {content.length}
              </span>
              <Button 
                type="submit" 
                disabled={loading || uploading || (!content.trim() && imageUrls.length === 0 && !videoUrl)} 
                className="mc-btn-primary px-4 h-9"
              >
                <Send className="h-4 w-4 mr-2" />
                <span className="mc-text">POST</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}