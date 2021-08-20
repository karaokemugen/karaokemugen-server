ALTER TABLE users ADD COLUMN flag_public BOOLEAN DEFAULT(true);
ALTER TABLE users ADD COLUMN flag_displayfavorites BOOLEAN DEFAULT(false);
ALTER TABLE users ADD COLUMN social_networks JSONB;
ALTER TABLE users ADD COLUMN banner CHARACTER VARYING;

UPDATE users SET flag_public = true;
