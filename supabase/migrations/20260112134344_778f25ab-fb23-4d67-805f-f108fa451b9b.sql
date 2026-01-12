-- Additional tables for Mobile Life-Analysis Ecosystem (without location_history)

-- Device contacts synced from phone
CREATE TABLE IF NOT EXISTS public.device_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  phone_contact_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phones TEXT[] DEFAULT '{}',
  emails TEXT[] DEFAULT '{}',
  organization TEXT,
  title TEXT,
  birthday TEXT,
  notes TEXT,
  has_photo BOOLEAN DEFAULT false,
  photo_base64 TEXT,
  linked_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, phone_contact_id)
);

ALTER TABLE public.device_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own device contacts" ON public.device_contacts;
CREATE POLICY "Users can manage their own device contacts" ON public.device_contacts
  FOR ALL USING (auth.uid() = user_id);

-- Bluetooth devices linked to contacts
CREATE TABLE IF NOT EXISTS public.bluetooth_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_type TEXT DEFAULT 'unknown',
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, device_id)
);

ALTER TABLE public.bluetooth_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own bluetooth devices" ON public.bluetooth_devices;
CREATE POLICY "Users can manage their own bluetooth devices" ON public.bluetooth_devices
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_device_contacts_user ON public.device_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_device_contacts_linked ON public.device_contacts(linked_profile_id) WHERE linked_profile_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bluetooth_devices_user ON public.bluetooth_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_bluetooth_devices_profile ON public.bluetooth_devices(profile_id);

-- Triggers (with IF NOT EXISTS logic)
DROP TRIGGER IF EXISTS update_device_contacts_updated_at ON public.device_contacts;
CREATE TRIGGER update_device_contacts_updated_at
  BEFORE UPDATE ON public.device_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bluetooth_devices_updated_at ON public.bluetooth_devices;
CREATE TRIGGER update_bluetooth_devices_updated_at
  BEFORE UPDATE ON public.bluetooth_devices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();