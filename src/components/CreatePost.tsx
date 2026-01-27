import { useState } from 'react';
import { ImagePlus, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';

interface CreatePostProps {
  onPostCreated: () => void;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim() || loading) return;

    setLoading(true);
    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      content: content.trim(),
      image_url: imageUrl.trim() || null,
    });

    if (!error) {
      setContent('');
      setImageUrl('');
      setShowImageInput(false);
      onPostCreated();
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="minecraft-card p-6 text-center">
        <p className="text-muted-foreground">
          <a href="/login" className="text-primary hover:underline">Sign in</a> to create posts
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="minecraft-card glow-border p-4 md:p-6 space-y-4">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's happening on the server?"
        className="min-h-24 bg-secondary/50 border-border resize-none input-glow"
        maxLength={500}
      />

      {showImageInput && (
        <div className="flex gap-2">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Paste image URL..."
            className="flex-1 px-3 py-2 rounded-md bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => { setShowImageInput(false); setImageUrl(''); }}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {imageUrl && (
        <div className="relative rounded-lg overflow-hidden border border-border">
          <img src={imageUrl} alt="Preview" className="w-full max-h-48 object-cover" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowImageInput(!showImageInput)}
          className="text-muted-foreground"
        >
          <ImagePlus className="h-4 w-4 mr-2" />
          Add Image
        </Button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{content.length}/500</span>
          <Button type="submit" disabled={loading || !content.trim()}>
            <Send className="h-4 w-4 mr-2" />
            Post
          </Button>
        </div>
      </div>
    </form>
  );
}
