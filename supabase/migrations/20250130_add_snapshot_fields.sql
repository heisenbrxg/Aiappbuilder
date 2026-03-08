-- Add missing fields to chat_snapshots table for proper snapshot restoration
-- This migration adds snapshot_message_id and summary fields

-- Add snapshot_message_id column to store the message ID for snapshot point reference
ALTER TABLE chat_snapshots 
ADD COLUMN IF NOT EXISTS snapshot_message_id text;

-- Add summary column for optional snapshot summary
ALTER TABLE chat_snapshots 
ADD COLUMN IF NOT EXISTS summary text;

-- Create index for faster lookups by snapshot_message_id
CREATE INDEX IF NOT EXISTS idx_snapshot_message_id 
ON chat_snapshots(snapshot_message_id) 
WHERE snapshot_message_id IS NOT NULL;

-- Add comment explaining the fields
COMMENT ON COLUMN chat_snapshots.snapshot_message_id IS 'Message ID at which this snapshot was taken, used for restoration to correct point';
COMMENT ON COLUMN chat_snapshots.summary IS 'Optional summary of the snapshot state';
