
--Fix constraint in case a referenced user deletes its account. SET NULL instead of CASCADE
ALTER TABLE inbox DROP CONSTRAINT inbox_fk_login_downloaded_fkey;
ALTER TABLE inbox ADD CONSTRAINT inbox_fk_login_downloaded_fkey FOREIGN KEY (fk_login_downloaded) REFERENCES users(pk_login) ON DELETE SET NULL;

ALTER TABLE inbox RENAME COLUMN pk_kid TO pk_inid