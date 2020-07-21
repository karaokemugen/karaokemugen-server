CREATE TABLE stats_session (
	pk_seid uuid NOT NULL,
	fk_iid uuid NOT NULL,
	name character varying NOT NULL,
	started_at timestamp with time zone NOT NULL,
	CONSTRAINT stats_session_pkey PRIMARY KEY (pk_seid),
	CONSTRAINT session_fk_iid_instance_fkey FOREIGN KEY (fk_iid) REFERENCES instance(pk_iid) ON DELETE CASCADE
);

INSERT INTO instance(config, modified_at, pk_iid, version) VALUES('{}'::jsonb,'1970-01-01', '00000000-0000-0000-0000-000000000000', 'Server') ON CONFLICT DO NOTHING;

INSERT INTO stats_session(pk_seid,
						  fk_iid,
						  name,
						  started_at)
VALUES('00000000-0000-0000-0000-000000000000',
	   (SELECT COALESCE ((SELECT pk_iid FROM instance WHERE version = 'Server'),
						'00000000-0000-0000-0000-000000000000')), 'Unknown session', '1970-01-01');


DROP INDEX idx_played_iid_startedat_kid_playedat;
DROP INDEX idx_requested_iid_startedat_kid_playedat;

ALTER TABLE stats_played DROP COLUMN pk_id_played;
ALTER TABLE stats_requested DROP COLUMN pk_id_requested;
ALTER TABLE stats_requested DROP COLUMN session_started_at;
ALTER TABLE stats_played DROP COLUMN session_started_at;
ALTER TABLE stats_played ADD COLUMN fk_seid UUID DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE stats_requested ADD COLUMN fk_seid UUID DEFAULT '00000000-0000-0000-0000-000000000000';
ALTER TABLE stats_played ADD CONSTRAINT played_fk_seid_session_fkey FOREIGN KEY (fk_seid) REFERENCES stats_session(pk_seid) ON DELETE CASCADE;
ALTER TABLE stats_requested ADD CONSTRAINT requested_fk_seid_session_fkey FOREIGN KEY (fk_seid) REFERENCES stats_session(pk_seid) ON DELETE CASCADE;
ALTER TABLE stats_requested DROP COLUMN fk_iid;
ALTER TABLE stats_played DROP COLUMN fk_iid;

CREATE UNIQUE INDEX idx_requested_seid_kid_requestedat ON stats_requested (fk_seid, fk_kid, requested_at);
CREATE UNIQUE INDEX idx_played_seid_kid_playedat ON stats_played (fk_seid, fk_kid, played_at);
