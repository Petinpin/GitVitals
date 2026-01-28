-- Sync Auth Users to Public Users Table
-- Run this in Supabase SQL Editor

-- Step 1: Check existing Auth users
SELECT id, email, created_at FROM auth.users ORDER BY email;

-- Step 2: Insert Auth users into public.users table
-- Using the IDs from auth.users to satisfy the foreign key constraint

-- For instructor@test.com - manually set as INSTRUCTOR
INSERT INTO public.users (id, email, name, role, canvas_id, created_at, updated_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'name', email), 
  'INSTRUCTOR', 
  'inst_001',
  created_at,
  NOW()
FROM auth.users 
WHERE email = 'instructor@test.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'INSTRUCTOR', canvas_id = 'inst_001', updated_at = NOW();

-- For student1@test.com - set as STUDENT
INSERT INTO public.users (id, email, name, role, canvas_id, created_at, updated_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'name', email), 
  'STUDENT', 
  'std_001',
  created_at,
  NOW()
FROM auth.users 
WHERE email = 'student1@test.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'STUDENT', canvas_id = 'std_001', updated_at = NOW();

-- Step 3: Verify public.users were created
SELECT id, email, name, role, canvas_id FROM public.users ORDER BY role, email;
