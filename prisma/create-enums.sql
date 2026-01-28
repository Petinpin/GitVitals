-- Create UserRole enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'INSTRUCTOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Verify the enum exists
SELECT * FROM pg_type WHERE typname = 'UserRole';
