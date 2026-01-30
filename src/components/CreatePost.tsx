import { useState, useRef } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
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

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim() || loading) return;

    setLoading(true);
    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      content: content.trim(),
      image_url: imageUrl || null,
    });

    if (!error) {
      setContent('');
      setImageUrl('');
      setImagePreview('');
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

  if (!user) {
    return (
      <div className="px-4 py-6 border-b border-border text-center">
        <p className="text-muted-foreground">
          <a href="/login" className="text-primary hover:underline">Sign in</a> to post
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 py-3 border-b border-border">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="bg-secondary text-muted-foreground font-display text-sm">
            {profile?.username?.slice(0, 2).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's happening?"
            className="min-h-[60px] bg-transparent border-0 resize-none text-xl placeholder:text-muted-foreground focus-visible:ring-0 p-0"
            maxLength={280}
          />

          {(imagePreview || imageUrl) && (
            <div className="relative mt-3 rounded-2xl overflow-hidden border border-border">
              <img src={imagePreview || imageUrl} alt="Preview" className="w-full max-h-80 object-cover" />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 hover:bg-background"
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
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-primary hover:bg-primary/10"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <ImagePlus className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-sm ${content.length > 260 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {content.length}/280
              </span>
              <Button 
                type="submit" 
                disabled={loading || !content.trim() || uploading} 
                className="rounded-full bg-primary hover:bg-primary/90 font-semibold px-4"
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}