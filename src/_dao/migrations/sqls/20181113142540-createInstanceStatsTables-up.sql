CREATE TABLE played
(
	pk_id_played serial NOT NULL,
	fk_id_instance integer NOT NULL,
	session_started_at timestamp NOT NULL,
	kid uuid NOT NULL,
	played_at timestamp NOT NULL
);

CREATE UNIQUE INDEX idx_played_instanceid_startedat_kid_playedat ON played (fk_id_instance, session_started_at, kid, played_at);

CREATE TABLE requested
(
	pk_id_requested serial NOT NULL,
	fk_id_instance integer NOT NULL,
	session_started_at timestamp NOT NULL,
	kid uuid NOT NULL,
	requested_at timestamp NOT NULL
);

CREATE UNIQUE INDEX idx_requested_instanceid_startedat_kid_requestedat ON requested (fk_id_instance, session_started_at, kid, requested_at);

CREATE TABLE favorite
(
	pk_id_favorite bigserial NOT NULL,
	fk_id_instance integer NOT NULL,
	kid uuid NOT NULL
);

CREATE UNIQUE INDEX idx_favorite_instanceid_kid ON favorite (fk_id_instance, kid);

CREATE TABLE instance
(
    pk_id_instance smallserial NOT NULL,
	modified_at timestamp NOT NULL,
	instance_id uuid NOT NULL UNIQUE,
	version character varying NOT NULL,
	locale char(2),
	screens smallint DEFAULT(1),
	cpu_manufacturer character varying,
	cpu_model character varying,
	cpu_speed character varying,
	cpu_cores smallint,
	memory integer,
	total_disk_space integer,
	os_platform character varying,
	os_distro character varying,
	os_release character varying,
	config jsonb NOT NULL
);