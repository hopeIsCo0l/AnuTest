# Quick Start: Add Database & Auth

## Step-by-Step Implementation

### 1. Install Dependencies

```bash
npm install @supabase/supabase-js
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create account
2. Create new project
3. Go to Settings → API
4. Copy your Project URL and anon public key

### 3. Add Environment Variables

Create `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Add to Vercel Dashboard → Settings → Environment Variables

### 4. Create Database Tables

In Supabase Dashboard → SQL Editor, run:

```sql
-- Exam attempts
CREATE TABLE exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  department_name TEXT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  time_spent INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own attempts"
  ON exam_attempts FOR ALL
  USING (auth.uid() = user_id);
```

### 5. Quick Implementation Files

I'll create the basic files you need - see the files I'm creating next!

