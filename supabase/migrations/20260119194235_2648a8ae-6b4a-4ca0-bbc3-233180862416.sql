-- Add updated_at column to dossiers table if it doesn't exist
ALTER TABLE dossiers 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create or replace the trigger function for auto-updating timestamps
CREATE OR REPLACE FUNCTION public.update_dossiers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS dossiers_updated_at_trigger ON dossiers;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER dossiers_updated_at_trigger
    BEFORE UPDATE ON dossiers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_dossiers_updated_at();