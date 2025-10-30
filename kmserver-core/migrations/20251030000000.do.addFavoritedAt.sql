ALTER TABLE users_favorites ADD COLUMN IF NOT EXISTS favorited_at TIMESTAMPTZ;

UPDATE users_favorites SET favorited_at = NOW();

