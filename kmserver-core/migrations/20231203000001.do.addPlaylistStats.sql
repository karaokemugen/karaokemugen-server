CREATE TABLE playlist_stats (
	fk_plaid uuid NOT NULL,
	favorited INTEGER,
	FOREIGN KEY(fk_plaid)
	  REFERENCES playlist(pk_plaid)
	  ON DELETE CASCADE
	  ON UPDATE CASCADE
)