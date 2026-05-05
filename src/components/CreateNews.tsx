import { useState, useRef } from 'react';
import { Newspaper, Send, Upload, X, Loader2, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/hooks/useAdmin';

interface CreateNewsProps {
  onNewsCreated: () => void;
}

const MAX_IMAGES = 10;

const SUPPORTED_VIDEO_TYPES = [
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
  'video/x-matroska', 'video/ogg', 'video/3gpp', 'video/3gpp2',
];

export function CreateNews({ onNewsCreated }: CreateNewsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoPreview, setVideoPreview] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [customTag, setCustomTag] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const uploadXhrRef = useRef<XMLHttpRequest | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    const remainingSlots = MAX_IMAGES - imageUrls.length;
    if (remainingSlots <= 0) {
      toast({ title: 'Maximum images reached', description: `You can only upload up to ${MAX_IMAGES} images per news post`, variant: 'destructive' });
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);

    for (const file of filesToUpload) {
      if (!file.type.startsWith('image/')) { toast({ title: 'Error', description: `${file.name} is not an image file`, variant: 'destructive' }); continue; }
      if (file.size > 5 * 1024 * 1024) { toast({ title: 'Error', description: `${file.name} must be less than 5MB`, variant: 'destructive' }); continue; }

      clearVideo();
      setUploading(true);

      const reader = new FileReader();
      reader.onload = (e) => setImagePreviews(prev => [...prev, e.target?.result as string]);
      reader.readAsDataURL(file);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('post-images').upload(fileName, file);

      if (uploadError) {
        toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
        setImagePreviews(prev => prev.slice(0, -1));
      } else {
        const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(fileName);
        setImageUrls(prev => [...prev, urlData.publicUrl]);
      }
      setUploading(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!SUPPORTED_VIDEO_TYPES.includes(file.type) && !file.type.startsWith('video/')) {
      toast({ title: 'Error', description: 'Please select a valid video file', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Video must be less than 5GB', variant: 'destructive' });
      return;
    }

    clearAllImages();
    setUploading(true);
    setUploadProgress(0);

    const previewUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data: { session } } = await supabase.auth.getSession();

    const uploadPromise = new Promise<{ error: Error | null }>((resolve) => {
      const xhr = new XMLHttpRequest();
      uploadXhrRef.current = xhr;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/post-videos/${fileName}`;

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) setUploadProgress(Math.round((event.loaded / event.total) * 100));
      });
      xhr.addEventListener('load', () => { uploadXhrRef.current = null; resolve({ error: xhr.status >= 200 && xhr.status < 300 ? null : new Error(`Upload failed with status ${xhr.status}`) }); });
      xhr.addEventListener('error', () => { uploadXhrRef.current = null; resolve({ error: new Error('Network error during upload') }); });
      xhr.addEventListener('abort', () => { uploadXhrRef.current = null; resolve({ error: new Error('Upload cancelled') }); });

      xhr.open('POST', url);
      xhr.setRequestHeader('Authorization', `Bearer ${session?.access_token}`);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.setRequestHeader('x-upsert', 'true');
      xhr.send(file);
    });

    const { error: uploadError } = await uploadPromise;

    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      setVideoPreview('');
      URL.revokeObjectURL(previewUrl);
    } else {
      const { data: urlData } = supabase.storage.from('post-videos').getPublicUrl(fileName);
      setVideoUrl(urlData.publicUrl);
      toast({ title: 'Upload complete!', description: 'Your video has been uploaded successfully.' });
    }

    setUploading(false);
    setUploadProgress(0);
  };

  const cancelUpload = () => {
    if (uploadXhrRef.current) { uploadXhrRef.current.abort(); uploadXhrRef.current = null; }
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoPreview(''); setVideoUrl(''); setUploading(false); setUploadProgress(0);
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !content.trim() || loading) return;

    setLoading(true);
    const { error } = await supabase.from('news').insert({
      user_id: user.id,
      title: title.trim(),
      content: content.trim(),
      image_url: imageUrls.length > 0 ? (imageUrls.length === 1 ? imageUrls[0] : JSON.stringify(imageUrls)) : (videoUrl || null),
      tag: selectedTag || null,
    });

    if (!error) {
      setTitle(''); setContent(''); setImageUrls([]); setImagePreviews([]);
      setVideoUrl(''); setVideoPreview(''); setShowForm(false); setSelectedTag(null); setCustomTag('');
      onNewsCreated();
      toast({ title: 'News posted successfully!' });
    } else {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const clearImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setImageUrls([]); setImagePreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoUrl(''); setVideoPreview('');
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  if (!user || !isAdmin) return null;

  if (!showForm) {
    return (
      <Button onClick={() => setShowForm(true)} className="w-full minecraft-border h-12 font-display">
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

      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="News title..." className="bg-secondary/50 border-2 border-border input-glow h-12 font-display" required />

      {/* GitHub-style tag selector */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {['announcement', 'update', 'event', 'warning', 'bug-fix', 'feature'].map((tag) => {
            const tagStyles: Record<string, string> = {
              announcement: 'border-blue-500/60 text-blue-400 hover:bg-blue-500/20',
              update: 'border-green-500/60 text-green-400 hover:bg-green-500/20',
              event: 'border-purple-500/60 text-purple-400 hover:bg-purple-500/20',
              warning: 'border-yellow-500/60 text-yellow-400 hover:bg-yellow-500/20',
              'bug-fix': 'border-red-500/60 text-red-400 hover:bg-red-500/20',
              feature: 'border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/20',
            };
            const activeStyles: Record<string, string> = {
              announcement: 'bg-blue-500/20',
              update: 'bg-green-500/20',
              event: 'bg-purple-500/20',
              warning: 'bg-yellow-500/20',
              'bug-fix': 'bg-red-500/20',
              feature: 'bg-emerald-500/20',
            };
            return (
              <button
                key={tag}
                type="button"
                onClick={() => { setSelectedTag(selectedTag === tag ? null : tag); setCustomTag(''); }}
                className={`px-2 py-0.5 rounded-full text-xs font-medium mc-text border transition-colors ${
                  tagStyles[tag]
                } ${selectedTag === tag ? activeStyles[tag] : ''}`}
              >
                {tag}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customTag}
            onChange={(e) => {
              const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24);
              setCustomTag(val);
              if (val) setSelectedTag(val);
              else setSelectedTag(null);
            }}
            placeholder="or type a custom tag…"
            className="flex-1 h-8 px-2 rounded-md border border-border bg-secondary/50 text-xs mc-text focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {customTag && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium mc-text border border-primary/60 text-primary bg-primary/10">
              {customTag}
            </span>
          )}
        </div>
      </div>

      <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="What's the news?" className="min-h-32 bg-secondary/50 border-2 border-border resize-none input-glow" required />

      <div className="space-y-2">
        <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
        <input ref={videoInputRef} type="file" accept="video/*,.mp4,.webm,.mov,.avi,.mkv,.ogg,.3gp" onChange={handleVideoUpload} className="hidden" />

        {imagePreviews.length === 0 && !videoPreview && !videoUrl && (
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="minecraft-border" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Add Images ({imageUrls.length}/{MAX_IMAGES})
            </Button>
            <Button type="button" variant="outline" className="minecraft-border" onClick={() => videoInputRef.current?.click()} disabled={uploading}>
              <Video className="h-4 w-4 mr-2" />
              Add Video
            </Button>
          </div>
        )}

        {imagePreviews.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground mc-text">{imagePreviews.length}/{MAX_IMAGES} images</span>
              <div className="flex gap-2">
                {imageUrls.length < MAX_IMAGES && (
                  <Button type="button" variant="ghost" size="sm" className="h-6 text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    + Add more
                  </Button>
                )}
                <Button type="button" variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-destructive" onClick={clearAllImages}>
                  Clear all
                </Button>
              </div>
            </div>
            <div className={`grid gap-2 ${imagePreviews.length === 1 ? 'grid-cols-1' : imagePreviews.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden border-2 border-border aspect-square">
                  <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                  <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6" onClick={() => clearImage(index)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            {uploading && (
              <div className="flex items-center gap-2 p-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-primary">Uploading...</span>
              </div>
            )}
          </div>
        )}

        {(videoPreview || videoUrl) && (
          <div className="relative rounded-lg overflow-hidden border-2 border-border">
            <video src={videoPreview || videoUrl} className="w-full max-h-48 object-contain bg-black" controls playsInline preload="metadata" />
            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2" onClick={clearVideo}>
              <X className="h-4 w-4" />
            </Button>
            {uploading && (
              <div className="absolute inset-0 bg-background/90 flex flex-col items-center justify-center gap-3 p-4">
                <Upload className="h-8 w-8 text-primary animate-pulse" />
                <div className="w-full max-w-xs">
                  <Progress value={uploadProgress} className="h-3" />
                  <p className="text-center mt-2 mc-text text-sm text-primary">{uploadProgress}% uploaded</p>
                  <Button type="button" variant="destructive" size="sm" onClick={cancelUpload} className="mt-3 w-full">
                    <X className="h-4 w-4 mr-2" /> Cancel Upload
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{content.length}/2000</span>
        <Button type="submit" disabled={loading || !title.trim() || !content.trim() || uploading} className="minecraft-border">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" />Publish</>}
        </Button>
      </div>
    </form>
  );
}
