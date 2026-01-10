-- =============================================
-- COMPREHENSIVE SECURITY HARDENING FOR ALL SENSITIVE TABLES
-- Ensures all policies are restricted to 'authenticated' role only
-- and adds base restrictive policies as a security defense-in-depth
-- =============================================

-- =============================================
-- 1. PSYCHOLOGICAL_PROFILES TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view their own psychological profiles" ON public.psychological_profiles;
DROP POLICY IF EXISTS "Users can create their own psychological profiles" ON public.psychological_profiles;
DROP POLICY IF EXISTS "Users can update their own psychological profiles" ON public.psychological_profiles;
DROP POLICY IF EXISTS "Users can delete their own psychological profiles" ON public.psychological_profiles;
DROP POLICY IF EXISTS "Users with SCI clearance can view profiles" ON public.psychological_profiles;
DROP POLICY IF EXISTS "Users with SCI clearance can manage profiles" ON public.psychological_profiles;

CREATE POLICY "Base: Only authenticated users can access psychological profiles"
ON public.psychological_profiles
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 2. CONTACT_BIOMETRICS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can insert their own biometrics" ON public.contact_biometrics;
DROP POLICY IF EXISTS "Users can update their own biometrics" ON public.contact_biometrics;
DROP POLICY IF EXISTS "Users can delete their own biometrics" ON public.contact_biometrics;
DROP POLICY IF EXISTS "Users with TOP SECRET clearance can view biometrics" ON public.contact_biometrics;
DROP POLICY IF EXISTS "Users with TOP SECRET clearance can manage biometrics" ON public.contact_biometrics;

CREATE POLICY "Base: Only authenticated users can access biometrics"
ON public.contact_biometrics
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 3. OAUTH_TOKENS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view their own oauth tokens" ON public.oauth_tokens;
DROP POLICY IF EXISTS "Users can create their own oauth tokens" ON public.oauth_tokens;
DROP POLICY IF EXISTS "Users can update their own oauth tokens" ON public.oauth_tokens;
DROP POLICY IF EXISTS "Users can delete their own oauth tokens" ON public.oauth_tokens;
DROP POLICY IF EXISTS "Users with clearance can view tokens" ON public.oauth_tokens;
DROP POLICY IF EXISTS "Users with clearance can manage tokens" ON public.oauth_tokens;

CREATE POLICY "Base: Only authenticated users can access oauth tokens"
ON public.oauth_tokens
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 4. CONTACT_BANK_ACCOUNTS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view their own contact bank accounts" ON public.contact_bank_accounts;
DROP POLICY IF EXISTS "Users can create their own contact bank accounts" ON public.contact_bank_accounts;
DROP POLICY IF EXISTS "Users can update their own contact bank accounts" ON public.contact_bank_accounts;
DROP POLICY IF EXISTS "Users can delete their own contact bank accounts" ON public.contact_bank_accounts;
DROP POLICY IF EXISTS "Users with SECRET clearance can view bank accounts" ON public.contact_bank_accounts;
DROP POLICY IF EXISTS "Users with SECRET clearance can manage bank accounts" ON public.contact_bank_accounts;

CREATE POLICY "Base: Only authenticated users can access bank accounts"
ON public.contact_bank_accounts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 5. CONTACT_PAYMENT_ACCOUNTS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view their own contact payment accounts" ON public.contact_payment_accounts;
DROP POLICY IF EXISTS "Users can create their own contact payment accounts" ON public.contact_payment_accounts;
DROP POLICY IF EXISTS "Users can update their own contact payment accounts" ON public.contact_payment_accounts;
DROP POLICY IF EXISTS "Users can delete their own contact payment accounts" ON public.contact_payment_accounts;
DROP POLICY IF EXISTS "Users with SECRET clearance can view payment accounts" ON public.contact_payment_accounts;
DROP POLICY IF EXISTS "Users with SECRET clearance can manage payment accounts" ON public.contact_payment_accounts;

CREATE POLICY "Base: Only authenticated users can access payment accounts"
ON public.contact_payment_accounts
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 6. CONTACT_IDENTITY_DOCUMENTS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view their own contact identity documents" ON public.contact_identity_documents;
DROP POLICY IF EXISTS "Users can create their own contact identity documents" ON public.contact_identity_documents;
DROP POLICY IF EXISTS "Users can update their own contact identity documents" ON public.contact_identity_documents;
DROP POLICY IF EXISTS "Users can delete their own contact identity documents" ON public.contact_identity_documents;
DROP POLICY IF EXISTS "Users with SECRET clearance can view identity documents" ON public.contact_identity_documents;
DROP POLICY IF EXISTS "Users with SECRET clearance can manage identity documents" ON public.contact_identity_documents;

CREATE POLICY "Base: Only authenticated users can access identity documents"
ON public.contact_identity_documents
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 7. EMAIL_MESSAGES TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view their own email messages" ON public.email_messages;
DROP POLICY IF EXISTS "Users can insert their own email messages" ON public.email_messages;
DROP POLICY IF EXISTS "Users can update their own email messages" ON public.email_messages;
DROP POLICY IF EXISTS "Users can delete their own email messages" ON public.email_messages;

CREATE POLICY "Base: Only authenticated users can access email messages"
ON public.email_messages
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 8. EMAIL_THREADS TABLE
-- =============================================
DROP POLICY IF EXISTS "Users can view their own email threads" ON public.email_threads;
DROP POLICY IF EXISTS "Users can insert their own email threads" ON public.email_threads;
DROP POLICY IF EXISTS "Users can update their own email threads" ON public.email_threads;
DROP POLICY IF EXISTS "Users can delete their own email threads" ON public.email_threads;

CREATE POLICY "Base: Only authenticated users can access email threads"
ON public.email_threads
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 9. CONTACT_METHODS TABLE - Strengthen existing policies
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can view their contact methods" ON public.contact_methods;
DROP POLICY IF EXISTS "Authenticated users can create contact methods" ON public.contact_methods;
DROP POLICY IF EXISTS "Authenticated users can update their contact methods" ON public.contact_methods;
DROP POLICY IF EXISTS "Authenticated users can delete their contact methods" ON public.contact_methods;

CREATE POLICY "Base: Only authenticated users can access contact methods"
ON public.contact_methods
FOR ALL
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

-- =============================================
-- COMMENTS FOR SECURITY DOCUMENTATION
-- =============================================
COMMENT ON POLICY "Base: Only authenticated users can access psychological profiles" ON public.psychological_profiles IS 
'Defense-in-depth: Requires authenticated user AND user_id match. Prevents access if clearance system is bypassed.';

COMMENT ON POLICY "Base: Only authenticated users can access biometrics" ON public.contact_biometrics IS 
'Defense-in-depth: Requires authenticated user AND user_id match. Protects facial/voice biometric data.';

COMMENT ON POLICY "Base: Only authenticated users can access oauth tokens" ON public.oauth_tokens IS 
'Defense-in-depth: Requires authenticated user AND user_id match. Protects third-party access tokens.';

COMMENT ON POLICY "Base: Only authenticated users can access bank accounts" ON public.contact_bank_accounts IS 
'Defense-in-depth: Requires authenticated user AND user_id match. Protects financial account data.';

COMMENT ON POLICY "Base: Only authenticated users can access payment accounts" ON public.contact_payment_accounts IS 
'Defense-in-depth: Requires authenticated user AND user_id match. Protects payment platform credentials.';

COMMENT ON POLICY "Base: Only authenticated users can access identity documents" ON public.contact_identity_documents IS 
'Defense-in-depth: Requires authenticated user AND user_id match. Protects passport/ID numbers.';

COMMENT ON POLICY "Base: Only authenticated users can access email messages" ON public.email_messages IS 
'Defense-in-depth: Requires authenticated user AND user_id match. Protects email content.';

COMMENT ON POLICY "Base: Only authenticated users can access email threads" ON public.email_threads IS 
'Defense-in-depth: Requires authenticated user AND user_id match. Protects conversation history.';

COMMENT ON POLICY "Base: Only authenticated users can access contact methods" ON public.contact_methods IS 
'Defense-in-depth: Requires authenticated user AND profile ownership. Protects phone/email data.';