UPDATE users SET type = 0 WHERE type = 2;
ALTER TABLE users ALTER COLUMN type TYPE REAL;