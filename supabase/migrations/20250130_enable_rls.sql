-- Enable Row Level Security (RLS) for production deployment
-- This migration secures the chat_snapshots table by enabling RLS and creating proper policies

-- Re-enable RLS on chat_snapshots table (was disabled for development)
ALTER TABLE chat_snapshots ENABLE ROW LEVEL SECURITY;

-- Drop the overly permissive anonymous grants
REVOKE ALL ON chat_snapshots FROM anon;

-- Create policy for users to manage their own snapshots
CREATE POLICY IF NOT EXISTS "Users can manage own snapshots" 
ON chat_snapshots
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policy for authenticated users to read their own snapshots
CREATE POLICY IF NOT EXISTS "Users can read own snapshots" 
ON chat_snapshots
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for authenticated users to insert their own snapshots
CREATE POLICY IF NOT EXISTS "Users can insert own snapshots" 
ON chat_snapshots
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create policy for authenticated users to update their own snapshots
CREATE POLICY IF NOT EXISTS "Users can update own snapshots" 
ON chat_snapshots
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create policy for authenticated users to delete their own snapshots
CREATE POLICY IF NOT EXISTS "Users can delete own snapshots" 
ON chat_snapshots
FOR DELETE
USING (auth.uid() = user_id);

-- Add similar RLS policies for user_chats if not already present
ALTER TABLE user_chats ENABLE ROW LEVEL SECURITY;

-- User chats policies
CREATE POLICY IF NOT EXISTS "Users can manage own chats" 
ON user_chats
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add comment explaining the security model
COMMENT ON TABLE chat_snapshots IS 'Row-level security enabled: Users can only access their own snapshots';
COMMENT ON TABLE user_chats IS 'Row-level security enabled: Users can only access their own chats';
