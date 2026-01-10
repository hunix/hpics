-- Fix RLS policies to explicitly target authenticated role only
-- This prevents any ambiguity and ensures unauthenticated users cannot access data

-- =============================================
-- FIX PROFILES TABLE POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profiles" ON public.profiles;

-- Recreate with explicit authenticated role
CREATE POLICY "Authenticated users can view their own profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create their own profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- FIX CONTACT_METHODS TABLE POLICIES
-- =============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view contact methods of their profiles" ON public.contact_methods;
DROP POLICY IF EXISTS "Users can create contact methods for their profiles" ON public.contact_methods;
DROP POLICY IF EXISTS "Users can update contact methods of their profiles" ON public.contact_methods;
DROP POLICY IF EXISTS "Users can delete contact methods of their profiles" ON public.contact_methods;

-- Recreate with explicit authenticated role
CREATE POLICY "Authenticated users can view their contact methods"
ON public.contact_methods
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = contact_methods.profile_id
  AND profiles.user_id = auth.uid()
));

CREATE POLICY "Authenticated users can create contact methods"
ON public.contact_methods
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = contact_methods.profile_id
  AND profiles.user_id = auth.uid()
));

CREATE POLICY "Authenticated users can update their contact methods"
ON public.contact_methods
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = contact_methods.profile_id
  AND profiles.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = contact_methods.profile_id
  AND profiles.user_id = auth.uid()
));

CREATE POLICY "Authenticated users can delete their contact methods"
ON public.contact_methods
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = contact_methods.profile_id
  AND profiles.user_id = auth.uid()
));

-- =============================================
-- ADD MISSING DELETE POLICY FOR EVENTS TABLE
-- =============================================

-- First check and drop if exists
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;

-- Add DELETE policy for events
CREATE POLICY "Authenticated users can delete their own events"
ON public.events
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);