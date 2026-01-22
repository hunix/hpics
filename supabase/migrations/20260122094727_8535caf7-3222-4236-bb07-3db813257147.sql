-- Add missing columns to constitutional_rules table to match hook interface
ALTER TABLE public.constitutional_rules 
ADD COLUMN IF NOT EXISTS rule_key TEXT,
ADD COLUMN IF NOT EXISTS rule_category TEXT,
ADD COLUMN IF NOT EXISTS rule_text TEXT,
ADD COLUMN IF NOT EXISTS evaluation_prompt TEXT,
ADD COLUMN IF NOT EXISTS action_on_violation TEXT DEFAULT 'log',
ADD COLUMN IF NOT EXISTS applies_to_categories TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_by UUID,
ADD COLUMN IF NOT EXISTS updated_by UUID;

-- Migrate existing data
UPDATE public.constitutional_rules 
SET 
  rule_key = COALESCE(rule_key, LOWER(REPLACE(rule_name, ' ', '_'))),
  rule_category = COALESCE(rule_category, category),
  rule_text = COALESCE(rule_text, description),
  action_on_violation = COALESCE(action_on_violation, violation_action),
  applies_to_categories = COALESCE(applies_to_categories, ARRAY[]::TEXT[]);

-- Make rule_key NOT NULL after migration
ALTER TABLE public.constitutional_rules 
ALTER COLUMN rule_key SET NOT NULL;

-- Create index on rule_key
CREATE INDEX IF NOT EXISTS idx_constitutional_rules_rule_key ON public.constitutional_rules(rule_key);