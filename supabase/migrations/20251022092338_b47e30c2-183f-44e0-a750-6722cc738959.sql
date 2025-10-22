-- Create enum for toilet status
CREATE TYPE toilet_status AS ENUM ('available', 'occupied', 'maintenance');

-- Create enum for payment methods
CREATE TYPE payment_method AS ENUM ('momo', 'rfid_card');

-- Create enum for payment status
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');

-- Create toilets table
CREATE TABLE public.toilets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  status toilet_status DEFAULT 'available',
  is_occupied BOOLEAN DEFAULT FALSE,
  occupied_since TIMESTAMPTZ,
  is_paid BOOLEAN DEFAULT FALSE,
  last_payment_time TIMESTAMPTZ,
  manual_open_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  toilet_id UUID REFERENCES public.toilets(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 200),
  payment_method payment_method NOT NULL,
  payment_reference TEXT NOT NULL,
  status payment_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create access_logs table to track usage
CREATE TABLE public.access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  toilet_id UUID REFERENCES public.toilets(id) ON DELETE CASCADE,
  entry_time TIMESTAMPTZ DEFAULT now(),
  exit_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  payment_id UUID REFERENCES public.payments(id),
  security_alert BOOLEAN DEFAULT FALSE,
  alert_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.toilets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users (admins)
CREATE POLICY "Authenticated users can view all toilets"
  ON public.toilets FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update toilets"
  ON public.toilets FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert toilets"
  ON public.toilets FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete toilets"
  ON public.toilets FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert payments"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view access logs"
  ON public.access_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert access logs"
  ON public.access_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update access logs"
  ON public.access_logs FOR UPDATE
  TO authenticated
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for toilets table
CREATE TRIGGER update_toilets_updated_at
  BEFORE UPDATE ON public.toilets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.toilets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.access_logs;