CREATE TABLE playlists (
	pk_plaid UUID PRIMARY KEY,
	name CHARACTER VARYING NOT NULL,
	slug CHARACTER VARYING UNIQUE NOT NULL,
	karacount INTEGER NOT NULL,
	duration INTEGER NOT NULL,
	created_at TIMESTAMPTZ NOT NULL,
	modified_at TIMESTAMPTZ NOT NULL,
	flag_visible BOOLEAN DEFAULT TRUE,
	flag_visible_online BOOLEAN DEFAULT TRUE,
	fk_login CHARACTER VARYING NOT NULL,
	fk_id_plcontent_playing INTEGER,
	FOREIGN KEY(fk_login)
	  REFERENCES users(pk_login)
	  ON DELETE CASCADE
	  ON UPDATE CASCADE
);

CREATE INDEX idx_playlists_slug ON playlists(slug);

CREATE TABLE playlists_contributors (
	fk_plaid UUID,
	fk_login CHARACTER VARYING,
	FOREIGN KEY(fk_plaid)
	  REFERENCES playlists(pk_plaid)
	  ON DELETE CASCADE
	  ON UPDATE CASCADE,
	FOREIGN KEY(fk_login)
	  REFERENCES users(pk_login)
	  ON DELETE CASCADE
	  ON UPDATE CASCADE
);

CREATE UNIQUE INDEX idx_playlists_contributors ON playlists_contributors (fk_plaid, fk_login);

CREATE TABLE playlists_content(
	pk_plcid SERIAL PRIMARY KEY,
	fk_plaid UUID NOT NULL,
	fk_kid UUID NOT NULL,
	created_at TIMESTAMPTZ NOT NULL,
	pos INTEGER NOT NULL,
	nickname CHARACTER VARYING,
	fk_login CHARACTER VARYING NOT NULL,
	flag_free BOOLEAN DEFAULT TRUE,
	flag_visible BOOLEAN DEFAULT TRUE,
	flag_accepted BOOLEAN DEFAULT FALSE,
	flag_refused BOOLEAN DEFAULT FALSE,
	FOREIGN KEY(fk_plaid)
	  REFERENCES playlists(pk_plaid)
	  ON DELETE CASCADE
	  ON UPDATE CASCADE
)