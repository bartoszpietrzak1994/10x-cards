-- Fix flashcards table to allow multiple flashcards per ai_generation
-- The unique constraint on ai_generation_id was preventing multiple flashcards
-- from being associated with the same AI generation, which is incorrect.

-- Drop the unique constraint on ai_generation_id
ALTER TABLE flashcards 
DROP CONSTRAINT IF EXISTS flashcards_ai_generation_id_key;

-- The index idx_flashcards_ai_generation_id already exists and will continue to work
-- for efficient queries without enforcing uniqueness

