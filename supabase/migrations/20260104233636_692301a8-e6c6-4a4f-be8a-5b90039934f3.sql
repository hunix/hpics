-- Add inference tracking columns to contact_relationships
ALTER TABLE contact_relationships
ADD COLUMN IF NOT EXISTS is_inferred boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS inferred_from_ids uuid[] DEFAULT '{}';