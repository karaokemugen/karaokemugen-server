CREATE TABLE played
(
	pk_id_played serial NOT NULL,
	fk_id_instance integer NOT NULL,
	session_id uuid NOT NULL,
	kid uuid NOT NULL,
	played_at timestamp NOT NULL
);

CREATE TABLE requested
(
	pk_id_requested serial NOT NULL,
	fk_id_instance integer NOT NULL,
	session_id uuid NOT NULL,
	kid uuid NOT NULL,
	played_at timestamp NOT NULL
);

CREATE TABLE favorite
(
	pk_id_favorite bigserial NOT NULL,
	fk_id_instance integer NOT NULL,
	kid uuid NOT NULL
);

CREATE TABLE instance
(
    pk_id_instance smallserial NOT NULL,
	created_at timestamp NOT NULL,
	modified_at timestamp NOT NULL,
	instance_id uuid NOT NULL,
	version character varying NOT NULL,
	locale char(2),
	screens smallint DEFAULT(1),
	cpu_manufacturer character varying,
	cpu_speed character varying,
	cpu_cores smallint,
	memory integer,
	total_disk_space integer,
	os_platform character varying,
	os_distro character varying,
	os_release character varying,
	config jsonb NOT NULL
);