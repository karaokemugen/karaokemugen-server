CREATE TABLE users_suggestions_liked (
	fk_id_suggest INTEGER,
	fk_login TEXT,
	FOREIGN KEY(fk_id_suggest)
	  REFERENCES suggestions(pk_id_suggest)
	  ON DELETE CASCADE
	  ON UPDATE CASCADE,
	FOREIGN KEY(fk_login)
	  REFERENCES users(pk_login)
	  ON DELETE CASCADE
	  ON UPDATE CASCADE
);