-- Create storage bucket for story images
INSERT INTO storage.buckets (id, name, public) VALUES ('story-images', 'story-images', true);

-- Create policies for story images bucket
CREATE POLICY "Story images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'story-images');

CREATE POLICY "Anyone can upload story images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'story-images');

CREATE POLICY "Anyone can update story images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'story-images');