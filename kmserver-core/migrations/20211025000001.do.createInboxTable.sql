CREATE TABLE inbox (
	pk_kid UUID NOT NULL,
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
	CONSTRAINT inbox_kid_pkey PRIMARY KEY (pk_kid)
)

ALTER TABLE inbox ADD CONSTRAINT inbox_fk_login_downloaded_fkey FOREIGN KEY (fk_login_downloaded) REFERENCES users(pk_login) ON DELETE CASCADE;