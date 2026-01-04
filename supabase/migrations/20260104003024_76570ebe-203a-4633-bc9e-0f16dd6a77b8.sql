-- Create table for bank accounts
CREATE TABLE public.contact_bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  bank_name TEXT NOT NULL,
  account_holder_name TEXT,
  account_number TEXT,
  iban TEXT,
  swift_code TEXT,
  branch_name TEXT,
  branch_code TEXT,
  currency TEXT DEFAULT 'USD',
  account_type TEXT, -- checking, savings, business, etc.
  is_primary BOOLEAN DEFAULT false,
  country TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for digital payment accounts (PayPal, Wamad, Click, etc.)
CREATE TABLE public.contact_payment_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL, -- PayPal, Wamad, Click, Venmo, Zelle, etc.
  account_identifier TEXT NOT NULL, -- email, phone, username
  account_holder_name TEXT,
  currency TEXT,
  country TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_primary BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for financial history/transactions
CREATE TABLE public.contact_financial_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL, -- sent, received, loan_given, loan_received, investment, etc.
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  transaction_date DATE NOT NULL,
  payment_method TEXT, -- bank_transfer, cash, paypal, etc.
  reference_number TEXT,
  status TEXT DEFAULT 'completed', -- pending, completed, cancelled
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_payment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_financial_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for bank accounts
CREATE POLICY "Users can view their own contact bank accounts" ON public.contact_bank_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own contact bank accounts" ON public.contact_bank_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contact bank accounts" ON public.contact_bank_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contact bank accounts" ON public.contact_bank_accounts FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for payment accounts
CREATE POLICY "Users can view their own contact payment accounts" ON public.contact_payment_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own contact payment accounts" ON public.contact_payment_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contact payment accounts" ON public.contact_payment_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contact payment accounts" ON public.contact_payment_accounts FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for financial history
CREATE POLICY "Users can view their own contact financial history" ON public.contact_financial_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own contact financial history" ON public.contact_financial_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own contact financial history" ON public.contact_financial_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own contact financial history" ON public.contact_financial_history FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger for bank accounts
CREATE TRIGGER update_contact_bank_accounts_updated_at
  BEFORE UPDATE ON public.contact_bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();