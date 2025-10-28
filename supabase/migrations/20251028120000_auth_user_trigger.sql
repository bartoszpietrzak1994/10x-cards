-- Migration: Auth User Trigger
-- Description: Automatically creates a record in public.users when a user confirms their email in auth.users
-- Date: 2025-10-28

-- Function to handle new user creation in public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_role_id integer;
BEGIN
  -- Get the ID of the default "user" role
  SELECT id INTO default_role_id FROM public.roles WHERE name = 'user';
  
  -- If the role doesn't exist, create it
  IF default_role_id IS NULL THEN
    INSERT INTO public.roles (name) VALUES ('user') RETURNING id INTO default_role_id;
  END IF;
  
  -- Create a record in public.users
  INSERT INTO public.users (id, email, role_id)
  VALUES (NEW.id, NEW.email, default_role_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Fires after INSERT on auth.users when email is confirmed
-- This handles the case where user confirms email immediately after registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Fires after UPDATE on auth.users when email becomes confirmed
-- This handles the case where user confirms email after registration (standard flow)
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON FUNCTION public.handle_new_user() TO postgres, service_role;

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a user record in public.users when auth.users email is confirmed';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Creates user record when email is confirmed during registration';
COMMENT ON TRIGGER on_auth_user_confirmed ON auth.users IS 'Creates user record when email is confirmed after registration';

