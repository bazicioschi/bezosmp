import { useState, useRef } from 'react';
import { ImagePlus, Video, X, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

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

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoPreview, setVideoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Clear video if adding image
    clearVideo();
    setUploading(true);

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(fileName, file);

    if (uploadError) {
      toast({
        title: 'Upload failed',
        description: uploadError.message,
        variant: 'destructive',
      });
      setImagePreview('');
    } else {
      const { data: urlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);
      setImageUrl(urlData.publicUrl);
    }

    setUploading(false);
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

    if (file.size > 1024 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Video must be less than 1GB',
        variant: 'destructive',
      });
      return;
    }

    // Clear image if adding video
    clearImage();
    setUploading(true);

    // Create video preview
    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('post-videos')
      .upload(fileName, file, {
        contentType: file.type,
      });

    if (uploadError) {
      toast({
        title: 'Upload failed',
        description: uploadError.message,
        variant: 'destructive',
      });
      setVideoPreview('');
      URL.revokeObjectURL(previewUrl);
    } else {
      const { data: urlData } = supabase.storage
        .from('post-videos')
        .getPublicUrl(fileName);
      setVideoUrl(urlData.publicUrl);
    }

    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim() || loading) return;

    setLoading(true);
    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      content: content.trim(),
      image_url: imageUrl || null,
      video_url: videoUrl || null,
    });

    if (!error) {
      setContent('');
      setImageUrl('');
      setImagePreview('');
      setVideoUrl('');
      setVideoPreview('');
      onPostCreated();
    }
    setLoading(false);
  };

  const clearImage = () => {
    setImageUrl('');
    setImagePreview('');
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
    clearImage();
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
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening on the server?"
            className="min-h-[80px] bg-transparent border-0 resize-none text-lg placeholder:text-muted-foreground focus-visible:ring-0 p-0 mc-text"
            maxLength={280}
          />

          {(imagePreview || imageUrl) && (
            <div className="relative mt-3 minecraft-card overflow-hidden">
              <img src={imagePreview || imageUrl} alt="Preview" className="w-full max-h-64 object-cover" />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 mc-slot hover:mc-slot-active"
                onClick={clearImage}
              >
                <X className="h-4 w-4" />
              </Button>
              {uploading && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
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
                disabled={uploading || !!videoUrl || !!videoPreview}
              >
                <ImagePlus className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-primary hover:bg-primary/10 mc-slot hover:mc-slot-active"
                onClick={() => videoInputRef.current?.click()}
                disabled={uploading || !!imageUrl || !!imagePreview}
              >
                <Video className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <span className={`mc-text text-sm ${content.length > 250 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {content.length}/280
              </span>
              <Button 
                type="submit" 
                disabled={loading || !content.trim() || uploading} 
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