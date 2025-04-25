-- Create user_notes table for storing personal notes on Bible verses
CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  verse_key TEXT NOT NULL, -- Format: 'bookId-chapter-verse' e.g., '창세기-1-1'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id and verse_key for faster lookups
CREATE INDEX IF NOT EXISTS user_notes_user_id_idx ON user_notes(user_id);
CREATE INDEX IF NOT EXISTS user_notes_verse_key_idx ON user_notes(verse_key);
CREATE UNIQUE INDEX IF NOT EXISTS user_notes_user_verse_idx ON user_notes(user_id, verse_key);

-- Add RLS (Row Level Security) policies
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notes
CREATE POLICY "Users can read own notes" 
  ON user_notes FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only insert their own notes
CREATE POLICY "Users can insert own notes" 
  ON user_notes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own notes
CREATE POLICY "Users can update own notes" 
  ON user_notes FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can only delete their own notes
CREATE POLICY "Users can delete own notes" 
  ON user_notes FOR DELETE 
  USING (auth.uid() = user_id);

-- Add timestamp trigger for automatic updated_at changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_notes_updated_at
BEFORE UPDATE ON user_notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 