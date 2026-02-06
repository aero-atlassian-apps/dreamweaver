CREATE TABLE IF NOT EXISTS voice_profiles (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  sample_url text,
  voice_model_id text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own voice profiles" ON voice_profiles;
CREATE POLICY "Users can manage their own voice profiles" ON voice_profiles
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_voice_profiles_updated_at ON voice_profiles;
CREATE TRIGGER update_voice_profiles_updated_at
BEFORE UPDATE ON voice_profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
