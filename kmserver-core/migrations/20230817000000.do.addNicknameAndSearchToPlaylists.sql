ALTER TABLE playlist ADD COLUMN fk_nickname CHARACTER VARYING;

ALTER TABLE playlist ADD COLUMN search_vector TSVECTOR;

UPDATE playlist SET fk_nickname = (SELECT nickname FROM users WHERE pk_login = playlist.fk_login);

ALTER TABLE playlist ADD CONSTRAINT fk_playlist_users_nickname FOREIGN KEY(fk_nickname) REFERENCES users(nickname) ON DELETE CASCADE ON UPDATE CASCADE;

UPDATE playlist SET search_vector = to_tsvector(name) || to_tsvector(description) || to_tsvector(fk_nickname);
