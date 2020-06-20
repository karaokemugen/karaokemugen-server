ALTER TABLE users ADD COLUMN password_last_modified_at TIMESTAMPTZ;
UPDATE users SET password_last_modified_at = NOW();