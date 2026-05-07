import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface Props {
  postId: string;
  href: string;
}

export function PostLinkPreview({ postId, href }: Props) {
  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<{ content: string; image_url: string | null; user_id: string } | null>(null);
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('posts')
        .select('content, image_url, user_id')
        .eq('id', postId)
        .maybeSingle();
      if (data) {
        setPost(data);
        const { data: prof } = await supabase
          .from('profiles')
          .select('username')
          .eq('user_id', data.user_id)
          .maybeSingle();
        if (prof) setUsername(prof.username);
      }
      setLoading(false);
    })();
  }, [postId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4 border border-border rounded bg-background/50">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!post) {
    return (
      <a href={href} className="underline text-xs break-all text-muted-foreground">{href}</a>
    );
  }

  let firstImage: string | null = null;
  if (post.image_url) {
    try {
      if (post.image_url.startsWith('[')) {
        const arr = JSON.parse(post.image_url);
        firstImage = Array.isArray(arr) && arr.length ? arr[0] : null;
      } else {
        firstImage = post.image_url;
      }
    } catch {
      firstImage = post.image_url;
    }
  }

  return (
    <Link to={`/?post=${postId}`} className="block border border-border rounded overflow-hidden bg-background/50 hover:bg-background transition-colors max-w-xs">
      {firstImage && (
        <img src={firstImage} alt="Post" className="w-full max-h-64 object-cover" />
      )}
      <div className="p-2">
        {username && <p className="text-xs font-semibold mc-text">@{username}</p>}
        <p className="text-sm line-clamp-3 whitespace-pre-wrap">{post.content}</p>
      </div>
    </Link>
  );
}
