# Production Setup Guide: Database, Auth & Backend

## Current State
- ✅ Frontend: React + Vite (deployed on Vercel)
- ❌ Backend: None (all client-side)
- ❌ Database: localStorage only
- ❌ Authentication: None

## Architecture Options

### Option 1: Vercel Serverless Functions + Supabase (Recommended)
**Best for:** Quick setup, stays on Vercel, great free tier

**Stack:**
- Frontend: Keep your React + Vite app
- Backend: Vercel Serverless Functions (API routes)
- Database: Supabase (PostgreSQL + Auth + Storage)
- Auth: Supabase Auth

**Pros:**
- ✅ No migration needed for frontend
- ✅ Serverless (scales automatically)
- ✅ Free tier generous
- ✅ Built-in auth
- ✅ Real-time capabilities

**Cons:**
- ⚠️ Cold starts on serverless functions
- ⚠️ Need to learn Supabase

---

### Option 2: Next.js Full-Stack Migration
**Best for:** Long-term, want everything in one framework

**Stack:**
- Frontend + Backend: Next.js (API routes)
- Database: Vercel Postgres or Supabase
- Auth: NextAuth.js or Clerk

**Pros:**
- ✅ Everything in one codebase
- ✅ Great SEO (if needed)
- ✅ Optimized performance
- ✅ Built-in API routes

**Cons:**
- ⚠️ Need to migrate entire frontend
- ⚠️ More complex setup

---

### Option 3: Separate Backend Service
**Best for:** Complex backend logic, microservices

**Stack:**
- Frontend: Keep React + Vite
- Backend: Node.js/Express or Nest.js (separate service)
- Database: PostgreSQL (Railway, Supabase, etc.)
- Auth: JWT + Passport or Auth0

**Pros:**
- ✅ Complete control
- ✅ Can scale independently
- ✅ Use any backend framework

**Cons:**
- ⚠️ More infrastructure to manage
- ⚠️ Need separate deployment
- ⚠️ More complex

---

## Recommended: Option 1 (Vercel Functions + Supabase)

### Step 1: Set Up Supabase

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and anon key

2. **Database Schema:**

```sql
-- Users table (Supabase handles auth.users, but we can extend)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Exam attempts table
CREATE TABLE exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  department_name TEXT NOT NULL,
  year TEXT NOT NULL,
  session TEXT NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  time_spent INTEGER NOT NULL, -- seconds
  total_questions INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Exam answers table
CREATE TABLE exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES exam_attempts(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL,
  selected_option INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Saved exam states (for resume functionality)
CREATE TABLE saved_exam_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  config JSONB NOT NULL, -- {department, year, session}
  questions JSONB NOT NULL,
  user_answers JSONB NOT NULL,
  time_left INTEGER NOT NULL,
  current_index INTEGER NOT NULL,
  flagged_questions INTEGER[],
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id) -- One saved exam per user
);

-- Indexes for performance
CREATE INDEX idx_exam_attempts_user_id ON exam_attempts(user_id);
CREATE INDEX idx_exam_attempts_created_at ON exam_attempts(created_at DESC);
CREATE INDEX idx_exam_answers_attempt_id ON exam_answers(attempt_id);
CREATE INDEX idx_saved_states_user_id ON saved_exam_states(user_id);
```

3. **Enable Row Level Security (RLS):**

```sql
-- Users can only see their own data
ALTER TABLE exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_exam_states ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own attempts"
  ON exam_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts"
  ON exam_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own answers"
  ON exam_answers FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM exam_attempts WHERE id = exam_answers.attempt_id
  ));

CREATE POLICY "Users can insert own answers"
  ON exam_answers FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM exam_attempts WHERE id = exam_answers.attempt_id
  ));

CREATE POLICY "Users can manage own saved states"
  ON saved_exam_states FOR ALL
  USING (auth.uid() = user_id);
```

### Step 2: Install Dependencies

```bash
npm install @supabase/supabase-js
npm install -D @types/node
```

### Step 3: Create Supabase Client

Create `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Step 4: Create Auth Service

Create `services/authService.ts`:

```typescript
import { supabase } from '../lib/supabase';

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const authService = {
  async signUp(data: SignUpData) {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
        },
      },
    });

    if (error) throw error;
    return authData;
  },

  async signIn(data: SignInData) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
  },
};
```

### Step 5: Create Database Service

Create `services/databaseService.ts`:

```typescript
import { supabase } from '../lib/supabase';
import { ExamSession, SavedExamState, ExamHistoryItem } from '../types';

export const databaseService = {
  // Save exam attempt
  async saveExamAttempt(session: ExamSession, departmentName: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Insert exam attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('exam_attempts')
      .insert({
        user_id: user.id,
        department_name: departmentName,
        year: session.timestamp.toString(), // Adjust based on your config
        session: 'practice', // Adjust based on your config
        score: session.score,
        time_spent: session.timeSpent,
        total_questions: session.questions.length,
      })
      .select()
      .single();

    if (attemptError) throw attemptError;

    // Insert answers
    const answers = session.questions.map((q) => ({
      attempt_id: attempt.id,
      question_id: q.id,
      selected_option: session.userAnswers[q.id] ?? -1,
      is_correct: session.userAnswers[q.id] === q.correctOptionIndex,
    }));

    const { error: answersError } = await supabase
      .from('exam_answers')
      .insert(answers);

    if (answersError) throw answersError;

    return attempt;
  },

  // Get exam history
  async getExamHistory(): Promise<ExamHistoryItem[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('exam_attempts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((attempt) => ({
      id: attempt.id,
      departmentName: attempt.department_name,
      score: attempt.score,
      date: attempt.created_at,
      timeSpent: attempt.time_spent,
      totalQuestions: attempt.total_questions,
    }));
  },

  // Save exam state (for resume)
  async saveExamState(state: SavedExamState) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    const { error } = await supabase
      .from('saved_exam_states')
      .upsert({
        user_id: user.id,
        config: state.config,
        questions: state.questions,
        user_answers: state.userAnswers,
        time_left: state.timeLeft,
        current_index: state.currentIndex,
        flagged_questions: state.flaggedQuestions,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) throw error;
  },

  // Get saved exam state
  async getSavedExamState(): Promise<SavedExamState | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('saved_exam_states')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      await this.clearSavedExamState();
      return null;
    }

    return {
      config: data.config,
      questions: data.questions,
      userAnswers: data.user_answers,
      timeLeft: data.time_left,
      currentIndex: data.current_index,
      flaggedQuestions: data.flagged_questions,
      timestamp: new Date(data.updated_at).getTime(),
    };
  },

  // Clear saved exam state
  async clearSavedExamState() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('saved_exam_states')
      .delete()
      .eq('user_id', user.id);
  },
};
```

### Step 6: Create Vercel Serverless Functions (Optional - for API routes)

Create `api/exam-questions.ts`:

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateExamQuestions } from '../services/geminiService';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { department, year, session } = req.body;
    const questions = await generateExamQuestions({ department, year, session });
    res.status(200).json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ error: 'Failed to generate questions' });
  }
}
```

### Step 7: Update Environment Variables

Add to `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Add to Vercel Dashboard → Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Step 8: Update App.tsx to Use Database

Replace localStorage calls with database service calls.

---

## Migration Checklist

- [ ] Set up Supabase project
- [ ] Create database schema
- [ ] Install dependencies
- [ ] Create Supabase client
- [ ] Create auth service
- [ ] Create database service
- [ ] Add authentication UI (sign up/sign in)
- [ ] Replace localStorage with database calls
- [ ] Add loading states
- [ ] Add error handling
- [ ] Test authentication flow
- [ ] Test data persistence
- [ ] Deploy and test

---

## Additional Production Features

### 1. Analytics
- Add Vercel Analytics
- Track exam completion rates
- User engagement metrics

### 2. Error Monitoring
- Sentry for error tracking
- LogRocket for session replay

### 3. Performance
- Add React Query for data fetching/caching
- Implement pagination for exam history
- Add loading skeletons

### 4. Security
- Rate limiting on API routes
- Input validation
- XSS protection
- CSRF protection

### 5. Features
- Email notifications
- Progress tracking
- Leaderboards
- Social sharing
- Export results as PDF

---

## Next Steps

1. Choose your architecture (recommended: Option 1)
2. Set up Supabase
3. Create database schema
4. Install dependencies
5. Implement step by step

Would you like me to help implement any specific part?

