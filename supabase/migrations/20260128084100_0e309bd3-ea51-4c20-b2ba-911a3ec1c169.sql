-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true);

-- Allow public read access to post images
CREATE POLICY "Post images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'post-images');

-- Allow authenticated users to upload post images
CREATE POLICY "Users can upload post images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'post-images' AND auth.uid() IS NOT NULL);

-- Allow users to delete their own post images
CREATE POLICY "Users can delete their own post images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create news table
CREATE TABLE public.news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on news
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- RLS policies for news
CREATE POLICY "News is viewable by everyone"
ON public.news
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create news"
ON public.news
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own news"
ON public.news
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own news"
ON public.news
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for news
ALTER PUBLICATION supabase_realtime ADD TABLE public.news;

-- Add trigger for updated_at
CREATE TRIGGER update_news_updated_at
BEFORE UPDATE ON public.news
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();