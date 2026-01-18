-- Add completed_analysis_modes column to media table to track which analysis modes have been completed
ALTER TABLE media ADD COLUMN IF NOT EXISTS completed_analysis_modes TEXT[] DEFAULT '{}';
ALTER TABLE media ADD COLUMN IF NOT EXISTS last_analysis_at TIMESTAMPTZ DEFAULT NULL;

-- Add completed_analysis_modes column to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS completed_analysis_modes TEXT[] DEFAULT '{}';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS last_analysis_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for efficient filtering of items with/without completed analysis
CREATE INDEX IF NOT EXISTS idx_media_completed_analysis_modes ON media USING GIN (completed_analysis_modes);
CREATE INDEX IF NOT EXISTS idx_documents_completed_analysis_modes ON documents USING GIN (completed_analysis_modes);

-- Create a helper function to check if all requested modes are already completed
CREATE OR REPLACE FUNCTION public.modes_all_completed(completed_modes TEXT[], requested_modes TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  -- Returns true if all requested modes are already in completed_modes
  RETURN requested_modes <@ completed_modes;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a helper function to get remaining modes to analyze
CREATE OR REPLACE FUNCTION public.get_remaining_modes(completed_modes TEXT[], requested_modes TEXT[])
RETURNS TEXT[] AS $$
BEGIN
  -- Returns requested modes that are NOT in completed_modes
  RETURN ARRAY(SELECT unnest(requested_modes) EXCEPT SELECT unnest(completed_modes));
END;
$$ LANGUAGE plpgsql IMMUTABLE;