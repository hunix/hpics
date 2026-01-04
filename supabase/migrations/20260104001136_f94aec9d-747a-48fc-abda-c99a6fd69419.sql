-- WhatsApp Business API configuration table
CREATE TABLE public.whatsapp_config (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  phone_number_id text NOT NULL,
  business_account_id text,
  display_phone_number text,
  webhook_verify_token text NOT NULL DEFAULT gen_random_uuid()::text,
  is_connected boolean NOT NULL DEFAULT false,
  last_webhook_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- WhatsApp message templates (pre-approved by Meta)
CREATE TABLE public.whatsapp_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  template_name text NOT NULL,
  template_language text NOT NULL DEFAULT 'en',
  category text NOT NULL DEFAULT 'MARKETING',
  status text NOT NULL DEFAULT 'PENDING',
  components jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add WhatsApp message tracking to messages table
ALTER TABLE public.messages
ADD COLUMN whatsapp_message_id text,
ADD COLUMN whatsapp_status text;

-- Enable RLS
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for whatsapp_config
CREATE POLICY "Users can view their own WhatsApp config"
  ON public.whatsapp_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own WhatsApp config"
  ON public.whatsapp_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp config"
  ON public.whatsapp_config FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WhatsApp config"
  ON public.whatsapp_config FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for whatsapp_templates
CREATE POLICY "Users can view their own WhatsApp templates"
  ON public.whatsapp_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own WhatsApp templates"
  ON public.whatsapp_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp templates"
  ON public.whatsapp_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WhatsApp templates"
  ON public.whatsapp_templates FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for whatsapp messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Trigger for updated_at on whatsapp_config
CREATE TRIGGER update_whatsapp_config_updated_at
  BEFORE UPDATE ON public.whatsapp_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on whatsapp_templates
CREATE TRIGGER update_whatsapp_templates_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();