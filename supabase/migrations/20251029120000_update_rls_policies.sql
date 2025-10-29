-- Migration: Update RLS Policies to use auth.uid()
-- Description: Updates RLS policies to use Supabase's built-in auth.uid() instead of current_setting
-- Date: 2025-10-29

-- ============================================================================
-- FLASHCARDS TABLE - Update RLS Policies
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS flashcards_select_anon ON flashcards;
DROP POLICY IF EXISTS flashcards_select_authenticated ON flashcards;
DROP POLICY IF EXISTS flashcards_insert_policy ON flashcards;
DROP POLICY IF EXISTS flashcards_update_policy ON flashcards;
DROP POLICY IF EXISTS flashcards_delete_policy ON flashcards;

-- Create new policies using auth.uid()
CREATE POLICY flashcards_select_policy ON flashcards
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY flashcards_insert_policy ON flashcards
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY flashcards_update_policy ON flashcards
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY flashcards_delete_policy ON flashcards
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- FLASHCARDS_AI_GENERATION TABLE - Enable RLS and Create Policies
-- ============================================================================

ALTER TABLE flashcards_ai_generation ENABLE ROW LEVEL SECURITY;

CREATE POLICY flashcards_ai_generation_select_policy ON flashcards_ai_generation
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY flashcards_ai_generation_insert_policy ON flashcards_ai_generation
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY flashcards_ai_generation_update_policy ON flashcards_ai_generation
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- AI_LOGS TABLE - Update RLS Policies
-- ============================================================================

-- Drop old policy
DROP POLICY IF EXISTS ai_logs_select_policy ON ai_logs;

-- Create new policy using auth.uid()
CREATE POLICY ai_logs_select_policy ON ai_logs
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM flashcards_ai_generation 
    WHERE id = flashcards_generation_id AND user_id = auth.uid()
  ));

-- ============================================================================
-- USERS TABLE - Enable RLS and Create Policies
-- ============================================================================

-- First, check if users table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email varchar(255) UNIQUE NOT NULL,
  role_id integer REFERENCES roles(id),
  created_at timestamptz DEFAULT current_timestamp NOT NULL,
  updated_at timestamptz DEFAULT current_timestamp NOT NULL
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies on users table
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;

-- Users can only read their own record
CREATE POLICY users_select_own ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Users can update their own record (for future profile updates)
CREATE POLICY users_update_own ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- ROLES TABLE - Create Public Read Policy
-- ============================================================================

-- Drop any existing policies on roles table
DROP POLICY IF EXISTS roles_select_all ON roles;

-- All authenticated users can read roles (needed for role names in UserDTO)
CREATE POLICY roles_select_all ON roles
  FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- Add helpful comments
-- ============================================================================

COMMENT ON POLICY flashcards_select_policy ON flashcards IS 'Users can only select their own flashcards';
COMMENT ON POLICY flashcards_insert_policy ON flashcards IS 'Users can only insert flashcards with their own user_id';
COMMENT ON POLICY flashcards_update_policy ON flashcards IS 'Users can only update their own flashcards';
COMMENT ON POLICY flashcards_delete_policy ON flashcards IS 'Users can only delete their own flashcards';

COMMENT ON POLICY flashcards_ai_generation_select_policy ON flashcards_ai_generation IS 'Users can only select their own AI generations';
COMMENT ON POLICY flashcards_ai_generation_insert_policy ON flashcards_ai_generation IS 'Users can only create AI generations for themselves';

COMMENT ON POLICY users_select_own ON users IS 'Users can only read their own user record';
COMMENT ON POLICY users_update_own ON users IS 'Users can only update their own user record';

COMMENT ON POLICY roles_select_all ON roles IS 'All authenticated users can read role definitions';

