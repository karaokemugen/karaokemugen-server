CREATE TABLE inbox (
	pk_kid PRIMARY KEY UUID,
	name TEXT,
	fk_login_downloaded TEXT,
	downloaded_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ,
	kara JSONB,
	extra_tags JSONB[],
	lyrics JSONB,
	mediafile TEXT,
	gitlab_issue INTEGER,
	fix BOOLEAN,
)

ALTER TABLE inbox ADD CONSTRAINT inbox_fk_login_downloaded_fkey FOREIGN KEY (fk_login_downloaded) REFERENCES users(pk_login) ON DELETE CASCADE;