-- 🚀 NEONDB PERFORMANCE INDEXES
-- Copy and paste this entire file into NeonDB SQL Editor

-- User lookup by Clerk ID (used on EVERY page load)
CREATE INDEX IF NOT EXISTS idx_user_clerk_id ON "User"("clerkId");

-- Automation queries (dashboard, list, etc)
CREATE INDEX IF NOT EXISTS idx_automation_user_id ON "Automation"("userId");
CREATE INDEX IF NOT EXISTS idx_automation_active ON "Automation"("active");
CREATE INDEX IF NOT EXISTS idx_automation_user_active ON "Automation"("userId", "active");

-- Keyword lookups (webhooks - CRITICAL for performance)
CREATE INDEX IF NOT EXISTS idx_keyword_word ON "Keyword"("word");
CREATE INDEX IF NOT EXISTS idx_keyword_automation ON "Keyword"("automationId");

-- Post lookups (automation builder)
CREATE INDEX IF NOT EXISTS idx_post_postid ON "Post"("postid");
CREATE INDEX IF NOT EXISTS idx_post_automation ON "Post"("automationId");

-- Integration lookups
CREATE INDEX IF NOT EXISTS idx_integration_user ON "Integrations"("userId");

-- Trigger lookups
CREATE INDEX IF NOT EXISTS idx_trigger_automation ON "Trigger"("automationId");

-- Listener lookups  
CREATE INDEX IF NOT EXISTS idx_listener_automation ON "Listener"("automationId");

-- ✅ Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

