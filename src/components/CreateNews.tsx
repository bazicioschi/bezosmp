import { useState, useRef } from 'react';
import { Newspaper, Send, Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateNewsProps {
  onNewsCreated: () => void;
}

export function CreateNews({ onNewsCreated }: CreateNewsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!user || !title.trim() || !content.trim() || loading) return;

    setLoading(true);
    const { error } = await supabase.from('news').insert({
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      image_url: imageUrl || null,
    });

    if (!error) {
      setTitle('');
      setContent('');
      setImageUrl('');
      setImagePreview('');
      setShowForm(false);
      onNewsCreated();
      toast({ title: 'News posted successfully!' });
    } else {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
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
      <div className="minecraft-card minecraft-border p-6 text-center">
        <p className="text-muted-foreground">
          <a href="/login" className="text-primary hover:underline font-display">Sign in</a> to post news
        </p>
      </div>
    );
  }

  if (!showForm) {
    return (
      <Button
        onClick={() => setShowForm(true)}
        className="w-full minecraft-border h-12 font-display"
      >
        <Newspaper className="h-5 w-5 mr-2" />
        POST NEWS
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="minecraft-card minecraft-border glow-border p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-foreground">Post News</h3>
        <Button type="button" variant="ghost" size="icon" onClick={() => setShowForm(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="News title..."
        className="bg-secondary/50 border-2 border-border input-glow h-12 font-display"
        maxLength={100}
        required
      />

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's the news?"
        className="min-h-32 bg-secondary/50 border-2 border-border resize-none input-glow"
        maxLength={2000}
        required
      />

      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id="news-image-upload"
        />
        
        {!imagePreview && (
          <Button
            type="button"
            variant="outline"
            className="minecraft-border"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Add Cover Image
          </Button>
        )}

        {(imagePreview || imageUrl) && (
          <div className="relative rounded-lg overflow-hidden border-2 border-border">
            <img src={imagePreview || imageUrl} alt="Preview" className="w-full max-h-48 object-cover" />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
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
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{content.length}/2000</span>
        <Button type="submit" disabled={loading || !title.trim() || !content.trim() || uploading} className="minecraft-border">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Publish
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
