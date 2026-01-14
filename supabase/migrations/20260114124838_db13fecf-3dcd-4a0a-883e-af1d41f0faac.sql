-- Add grid_columns column to dashboard_layouts table
ALTER TABLE dashboard_layouts 
ADD COLUMN IF NOT EXISTS grid_columns integer DEFAULT 2;

-- Add check constraint for valid column range
ALTER TABLE dashboard_layouts 
ADD CONSTRAINT grid_columns_range CHECK (grid_columns >= 1 AND grid_columns <= 6);