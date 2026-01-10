-- =============================================
-- COMPREHENSIVE MEDIA INTELLIGENCE TABLES
-- =============================================

-- Category templates for detected items
CREATE TABLE public.item_category_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  specification_schema JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default category templates
INSERT INTO public.item_category_templates (category, display_name, description, icon, specification_schema) VALUES
('vehicle', 'Vehicles', 'Cars, motorcycles, boats, bicycles, trucks', 'Car', '{"make": "string", "model": "string", "year": "number", "color": "string", "plate_number": "string", "vin": "string", "body_type": "string"}'),
('device', 'Devices', 'Phones, laptops, tablets, cameras, electronics', 'Smartphone', '{"brand": "string", "model": "string", "os": "string", "screen_size": "string", "storage": "string", "color": "string", "serial_number": "string"}'),
('document', 'Documents', 'IDs, passports, licenses, invoices, contracts', 'FileText', '{"document_number": "string", "issue_date": "string", "expiry_date": "string", "issuing_authority": "string", "document_subtype": "string"}'),
('jewelry', 'Jewelry & Accessories', 'Rings, watches, necklaces, bracelets', 'Watch', '{"material": "string", "brand": "string", "stones": "string", "estimated_value": "number", "style": "string"}'),
('property', 'Property', 'Houses, apartments, land, businesses', 'Building', '{"address": "string", "size_sqm": "number", "property_type": "string", "estimated_value": "number", "year_built": "number"}'),
('account', 'Accounts', 'Social media, email, banking, subscriptions', 'User', '{"platform": "string", "username": "string", "handle": "string", "url": "string", "account_type": "string"}'),
('clothing', 'Clothing', 'Apparel, shoes, bags, accessories', 'Shirt', '{"brand": "string", "size": "string", "color": "string", "material": "string", "style": "string"}'),
('furniture', 'Furniture', 'Home and office furniture', 'Sofa', '{"brand": "string", "material": "string", "dimensions": "string", "color": "string", "style": "string"}'),
('pet', 'Pets', 'Dogs, cats, and other animals', 'PawPrint', '{"species": "string", "breed": "string", "name": "string", "age": "string", "color": "string"}'),
('other', 'Other Items', 'Miscellaneous items and belongings', 'Package', '{"custom_fields": "object"}');

-- Master table for all detected items/assets
CREATE TABLE public.detected_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_id UUID REFERENCES public.media(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Classification
  category TEXT NOT NULL REFERENCES public.item_category_templates(category),
  item_type TEXT NOT NULL,
  
  -- AI-extracted data
  name TEXT,
  brand TEXT,
  model TEXT,
  description TEXT,
  specifications JSONB DEFAULT '{}',
  
  -- Visual data
  bounding_box JSONB,
  cropped_image_url TEXT,
  confidence NUMERIC DEFAULT 0,
  
  -- Linking status
  linked_status TEXT NOT NULL DEFAULT 'pending' CHECK (linked_status IN ('pending', 'auto_linked', 'manually_linked', 'ignored')),
  linked_at TIMESTAMPTZ,
  linked_by TEXT,
  
  -- Metadata
  ai_model_used TEXT,
  source_mosaic_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unknown/unidentified persons for manual tagging
CREATE TABLE public.unknown_persons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_id UUID REFERENCES public.media(id) ON DELETE CASCADE,
  
  -- Face data
  face_region JSONB,
  facial_features JSONB,
  cropped_image_url TEXT,
  
  -- Demographics
  estimated_age_range TEXT,
  estimated_gender TEXT,
  
  -- Matching
  suggested_profiles JSONB DEFAULT '[]',
  best_match_confidence NUMERIC DEFAULT 0,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'unidentified' CHECK (status IN ('unidentified', 'identified', 'new_contact_created', 'ignored')),
  assigned_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  
  -- Metadata
  ai_model_used TEXT,
  source_mosaic_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Document intelligence extraction
CREATE TABLE public.extracted_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  media_id UUID REFERENCES public.media(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Document classification
  document_type TEXT NOT NULL,
  document_subtype TEXT,
  
  -- OCR content
  raw_text TEXT,
  structured_data JSONB DEFAULT '{}',
  
  -- Contact linking
  extracted_contact_info JSONB DEFAULT '{}',
  suggested_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  match_confidence NUMERIC DEFAULT 0,
  
  -- Status
  linked_status TEXT NOT NULL DEFAULT 'pending' CHECK (linked_status IN ('pending', 'auto_linked', 'manually_linked', 'ignored')),
  linked_at TIMESTAMPTZ,
  
  -- Visual data
  bounding_box JSONB,
  cropped_image_url TEXT,
  
  -- Metadata
  ai_model_used TEXT,
  source_mosaic_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mosaic processing sessions for tracking
CREATE TABLE public.mosaic_metadata_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Session info
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_images INTEGER NOT NULL DEFAULT 0,
  processed_images INTEGER NOT NULL DEFAULT 0,
  total_mosaics INTEGER NOT NULL DEFAULT 0,
  processed_mosaics INTEGER NOT NULL DEFAULT 0,
  
  -- Results
  items_detected INTEGER DEFAULT 0,
  faces_detected INTEGER DEFAULT 0,
  documents_detected INTEGER DEFAULT 0,
  auto_linked_count INTEGER DEFAULT 0,
  pending_review_count INTEGER DEFAULT 0,
  
  -- Cost tracking
  estimated_cost_cents INTEGER DEFAULT 0,
  actual_cost_cents INTEGER DEFAULT 0,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Error handling
  error_message TEXT,
  failed_media_ids UUID[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.item_category_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.detected_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unknown_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mosaic_metadata_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for item_category_templates (public read)
CREATE POLICY "Anyone can view category templates"
  ON public.item_category_templates FOR SELECT
  USING (true);

-- RLS Policies for detected_items
CREATE POLICY "Users can view their own detected items"
  ON public.detected_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own detected items"
  ON public.detected_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own detected items"
  ON public.detected_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own detected items"
  ON public.detected_items FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for unknown_persons
CREATE POLICY "Users can view their own unknown persons"
  ON public.unknown_persons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own unknown persons"
  ON public.unknown_persons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unknown persons"
  ON public.unknown_persons FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own unknown persons"
  ON public.unknown_persons FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for extracted_documents
CREATE POLICY "Users can view their own extracted documents"
  ON public.extracted_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own extracted documents"
  ON public.extracted_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own extracted documents"
  ON public.extracted_documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own extracted documents"
  ON public.extracted_documents FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for mosaic_metadata_sessions
CREATE POLICY "Users can view their own mosaic sessions"
  ON public.mosaic_metadata_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own mosaic sessions"
  ON public.mosaic_metadata_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mosaic sessions"
  ON public.mosaic_metadata_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mosaic sessions"
  ON public.mosaic_metadata_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_detected_items_user_id ON public.detected_items(user_id);
CREATE INDEX idx_detected_items_media_id ON public.detected_items(media_id);
CREATE INDEX idx_detected_items_profile_id ON public.detected_items(profile_id);
CREATE INDEX idx_detected_items_category ON public.detected_items(category);
CREATE INDEX idx_detected_items_status ON public.detected_items(linked_status);

CREATE INDEX idx_unknown_persons_user_id ON public.unknown_persons(user_id);
CREATE INDEX idx_unknown_persons_media_id ON public.unknown_persons(media_id);
CREATE INDEX idx_unknown_persons_status ON public.unknown_persons(status);

CREATE INDEX idx_extracted_documents_user_id ON public.extracted_documents(user_id);
CREATE INDEX idx_extracted_documents_media_id ON public.extracted_documents(media_id);
CREATE INDEX idx_extracted_documents_status ON public.extracted_documents(linked_status);

CREATE INDEX idx_mosaic_sessions_user_id ON public.mosaic_metadata_sessions(user_id);
CREATE INDEX idx_mosaic_sessions_status ON public.mosaic_metadata_sessions(status);

-- Trigger for updated_at
CREATE TRIGGER update_detected_items_updated_at
  BEFORE UPDATE ON public.detected_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_unknown_persons_updated_at
  BEFORE UPDATE ON public.unknown_persons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_extracted_documents_updated_at
  BEFORE UPDATE ON public.extracted_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mosaic_sessions_updated_at
  BEFORE UPDATE ON public.mosaic_metadata_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();