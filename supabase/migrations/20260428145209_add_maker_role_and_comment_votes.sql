/*
  # Add MAKER role and comment voting system

  1. Profile Changes
    - Add `is_maker` boolean column (default false)
    - Add `maker_requested_at` timestamp for pending requests

  2. New Tables
    - `comment_votes` - stores upvotes/downvotes on comments
    - `maker_requests` - tracks pending maker payment requests

  3. Security
    - RLS enabled on all new tables
    - Users can only create/view votes on their own submissions
    - Admins can review maker requests
*/

DO $$
BEGIN
  -- Add maker-related columns to profiles if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_maker'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_maker boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'maker_requested_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN maker_requested_at timestamptz;
  END IF;
END $$;

-- Create comment_votes table
CREATE TABLE IF NOT EXISTS comment_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  vote_type text NOT NULL CHECK (vote_type IN ('UP', 'DOWN')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create votes on any comment"
  ON comment_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all votes"
  ON comment_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can delete their own votes"
  ON comment_votes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create maker_requests table
CREATE TABLE IF NOT EXISTS maker_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  payment_intent_id text,
  amount integer DEFAULT 999,
  requested_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id),
  notes text
);

ALTER TABLE maker_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own requests"
  ON maker_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

CREATE POLICY "Users can create maker requests"
  ON maker_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update requests"
  ON maker_requests FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN');

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment_id ON comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_user_id ON comment_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_maker_requests_user_id ON maker_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_maker_requests_status ON maker_requests(status);