-- Create favorite_questions table
CREATE TABLE IF NOT EXISTS favorite_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_category TEXT,
    company TEXT,
    position TEXT,
    round TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure uniqueness per user per question
    UNIQUE(user_id, question_text, company, position, round)
);

-- Create index for faster queries by user
CREATE INDEX IF NOT EXISTS idx_favorite_questions_user_id ON favorite_questions(user_id);

-- Create index for filtering by metadata
CREATE INDEX IF NOT EXISTS idx_favorite_questions_metadata ON favorite_questions(user_id, company, position, round);

-- Enable RLS
ALTER TABLE favorite_questions ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own favorites
CREATE POLICY "Users can view their own favorite questions"
    ON favorite_questions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorite questions"
    ON favorite_questions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorite questions"
    ON favorite_questions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite questions"
    ON favorite_questions FOR DELETE
    USING (auth.uid() = user_id);
