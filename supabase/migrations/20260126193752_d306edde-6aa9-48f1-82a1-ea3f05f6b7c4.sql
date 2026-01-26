-- Add app_published_version to platform_config
INSERT INTO platform_config (config_key, config_value, category, display_name, description, value_type, default_value)
VALUES (
  'app_published_version',
  '"3.9.51"',
  'system',
  'Published App Version',
  'The currently published application version. Update this after each publish to notify users of new versions.',
  'string',
  '"3.9.51"'
)
ON CONFLICT (config_key) DO UPDATE SET 
  config_value = EXCLUDED.config_value,
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description;