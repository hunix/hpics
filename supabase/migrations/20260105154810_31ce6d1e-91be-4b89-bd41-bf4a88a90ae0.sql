-- Drop the existing constraint
ALTER TABLE public.messages 
DROP CONSTRAINT IF EXISTS messages_media_id_fkey;

-- Re-add with ON DELETE SET NULL
ALTER TABLE public.messages 
ADD CONSTRAINT messages_media_id_fkey 
FOREIGN KEY (media_id) 
REFERENCES public.media(id) 
ON DELETE SET NULL;