-- Re-enable RLS for production deployment
-- This fixes the issue where chat_snapshots and user_chats RLS was disabled

-- Re-enable RLS on chat_snapshots
ALTER TABLE chat_snapshots ENABLE ROW LEVEL SECURITY;

-- Re-enable RLS on user_chats
ALTER TABLE user_chats ENABLE ROW LEVEL SECURITY;

-- Drop any overly permissive grants
REVOKE ALL ON chat_snapshots FROM anon;
REVOKE ALL ON user_chats FROM anon;

-- Ensure delete policy exists for chat_snapshots
DROP POLICY IF EXISTS "Users can delete own snapshots" ON chat_snapshots;
CREATE POLICY "Users can delete own snapshots" 
ON chat_snapshots
FOR DELETE
USING (auth.uid() = user_id);

-- Ensure delete policy exists for user_chats
DROP POLICY IF EXISTS "Users can delete own chats" ON user_chats;
CREATE POLICY "Users can delete own chats" 
ON user_chats
FOR DELETE
USING (auth.uid() = user_id);

-- Ensure ALL operations policy exists for chat_snapshots
DROP POLICY IF EXISTS "Users can manage own snapshots" ON chat_snapshots;
CREATE POLICY "Users can manage own snapshots" 
ON chat_snapshots
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Ensure ALL operations policy exists for user_chats
DROP POLICY IF EXISTS "Users can manage own chats" ON user_chats;
CREATE POLICY "Users can manage own chats" 
ON user_chats
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add security comments
COMMENT ON TABLE chat_snapshots IS 'RLS enabled: Users can only access/delete their own snapshots';
COMMENT ON TABLE user_chats IS 'RLS enabled: Users can only access/delete their own chats';
