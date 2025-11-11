-- Migration: Add INSERT policy for ai_logs table
-- Description: Allows authenticated users to insert their own AI generation logs
-- Date: 2025-11-11

-- ============================================================================
-- AI_LOGS TABLE - Add INSERT Policy
-- ============================================================================

-- Create INSERT policy for ai_logs
-- Users can only insert logs for their own AI generations
CREATE POLICY ai_logs_insert_policy ON ai_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM flashcards_ai_generation 
    WHERE id = flashcards_generation_id 
    AND user_id = auth.uid()
  ));

-- Add UPDATE policy for ai_logs (for updating response_time, token_count, error_info)
CREATE POLICY ai_logs_update_policy ON ai_logs
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM flashcards_ai_generation 
    WHERE id = flashcards_generation_id 
    AND user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM flashcards_ai_generation 
    WHERE id = flashcards_generation_id 
    AND user_id = auth.uid()
  ));

-- ============================================================================
-- Add helpful comments
-- ============================================================================

COMMENT ON POLICY ai_logs_insert_policy ON ai_logs IS 'Users can only insert logs for their own AI generations';
COMMENT ON POLICY ai_logs_update_policy ON ai_logs IS 'Users can only update logs for their own AI generations';

