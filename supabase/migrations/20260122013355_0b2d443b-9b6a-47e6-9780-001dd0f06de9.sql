-- Seed navigation configuration into platform_config with all required fields
INSERT INTO public.platform_config (config_key, config_value, category, display_name, description, value_type, default_value) VALUES
  ('navigation.agent_intelligence.tabs', 
   '["observability","tribunals","verification","memory","procedural","cost-analytics","network-ml","auto-enrichment","anomaly","intervention","health","reality","meta-learning"]',
   'navigation', 'Agent Intelligence Tabs', 'Visible tabs in Agent Intelligence page', 'json', '[]'),
  ('navigation.admin.sections',
   '["edge-functions","workflows","constitutional-rules","kill-switches","genesis-config"]',
   'navigation', 'Admin Sections', 'Available admin configuration sections', 'json', '[]'),
  ('genesis.reality_creation.enabled', 'true', 'genesis', 'Reality Creation Enabled', 'Enable Phase 22 Reality Creation operations', 'boolean', 'true'),
  ('genesis.causal_origination.max_depth', '10', 'genesis', 'Causal Chain Max Depth', 'Maximum depth for causal chain origination', 'number', '10'),
  ('genesis.synthesis.intensity_default', '0.7', 'genesis', 'Synthesis Default Intensity', 'Default intensity for genesis synthesis operations', 'number', '0.5')
ON CONFLICT (config_key) DO NOTHING;