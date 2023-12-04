CREATE TABLE users_playlist_favorites (
	fk_login TEXT NOT NULL,
	fk_plaid uuid NOT NULL,
	FOREIGN KEY(fk_plaid)
	  REFERENCES playlist(pk_plaid)
	  ON DELETE CASCADE
	  ON UPDATE CASCADE,
	FOREIGN KEY(fk_login)
	  REFERENCES users(pk_login)
	  ON DELETE CASCADE
	  ON UPDATE CASCADE
);

CREATE INDEX idx_users_playlist_favorites_user ON users_playlist_favorites(fk_login);

CREATE INDEX idx_users_playlist_favorites_playlist ON users_playlist_favorites(fk_plaid);