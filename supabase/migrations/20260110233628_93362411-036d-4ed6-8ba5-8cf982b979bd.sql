-- Consolidate profiles table policies into single restrictive policy
-- for consistency with other sensitive tables and defense-in-depth

-- Drop existing separate policies
DROP POLICY IF EXISTS "Authenticated users can view their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can create their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update their own profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can delete their own profiles" ON public.profiles;

-- Create single consolidated policy for maximum restriction
CREATE POLICY "Base: Only authenticated users can access their own profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add security documentation
COMMENT ON POLICY "Base: Only authenticated users can access their own profiles" ON public.profiles IS 
'Defense-in-depth: Single consolidated policy requiring authenticated user AND user_id match. Prevents any access without valid authentication.';