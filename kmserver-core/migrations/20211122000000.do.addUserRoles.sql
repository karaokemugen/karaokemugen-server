ALTER TABLE users ADD COLUMN IF NOT EXISTS roles JSONB;

UPDATE users SET roles = '{"admin": true, "user": true}'::jsonb WHERE type = 0;
UPDATE users SET roles = '{"maintainer": true, "user": true}'::jsonb WHERE type = 0.5;
UPDATE users SET roles = '{"user": true}'::jsonb WHERE type = 1;

ALTER TABLE users DROP COLUMN type;