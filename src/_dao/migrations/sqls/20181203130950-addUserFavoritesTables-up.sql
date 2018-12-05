/* Replace with your SQL commands */

CREATE TABLE users (
	pk_id_user serial PRIMARY KEY,
	login character varying UNIQUE,
	nickname character varying UNIQUE,
	password character varying,
	type smallint NOT NULL,
	avatar_file character varying,
	bio character varying,
	url character varying,
	email character varying
);

CREATE TABLE users_favorites (
	fk_id_user integer NOT NULL,
	kid uuid NOT NULL
);
