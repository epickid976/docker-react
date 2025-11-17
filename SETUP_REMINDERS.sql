-- Create reminders table for storing user hydration reminders
-- Run this in your Supabase SQL Editor if the table doesn't exist
-- If the table already exists, this will add the CHECK constraint and remove the UNIQUE constraint

-- Drop the UNIQUE constraint if it exists (it was causing issues when selecting all days)
-- Try common constraint names - if none exist, this will do nothing
ALTER TABLE IF EXISTS public.reminders DROP CONSTRAINT IF EXISTS reminders_user_id_reminder_time_title_key;
ALTER TABLE IF EXISTS public.reminders DROP CONSTRAINT IF EXISTS reminders_user_id_reminder_time_title_unique;

CREATE TABLE IF NOT EXISTS public.reminders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  message TEXT,
  reminder_time TIME NOT NULL,
  days_of_week INTEGER[] NOT NULL CHECK (
    array_length(days_of_week, 1) > 0 AND
    array_length(days_of_week, 1) <= 7 AND
    (SELECT COUNT(*) = 0 FROM unnest(days_of_week) AS d WHERE d < 1 OR d > 7)
  ),
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop existing CHECK constraint if it exists (to update it)
ALTER TABLE IF EXISTS public.reminders DROP CONSTRAINT IF EXISTS reminders_days_of_week_check;

-- Add CHECK constraint for days_of_week
ALTER TABLE public.reminders 
ADD CONSTRAINT reminders_days_of_week_check CHECK (
  array_length(days_of_week, 1) > 0 AND
  array_length(days_of_week, 1) <= 7 AND
  (SELECT COUNT(*) = 0 FROM unnest(days_of_week) AS d WHERE d < 1 OR d > 7)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own reminders" ON public.reminders;

-- RLS Policy: Users can only access their own reminders
CREATE POLICY "Users can manage their own reminders" ON public.reminders
  FOR ALL USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS reminders_user_id_idx ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS reminders_enabled_idx ON public.reminders(enabled) WHERE enabled = true;

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_reminders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS reminders_updated_at ON public.reminders;

-- Create trigger to automatically update updated_at
CREATE TRIGGER reminders_updated_at
  BEFORE UPDATE ON public.reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_reminders_updated_at();

-- Verify the table was created
SELECT 
  'reminders table created successfully!' as message,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename = 'reminders';

