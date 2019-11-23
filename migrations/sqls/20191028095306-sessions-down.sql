DROP INDEX idx_requested_iid_seid_kid_requestedat;
DROP INDEX idx_played_iid_seid_kid_playedat;

ALTER TABLE stats_requested DROP CONSTRAINT requested_fk_seid_session_fkey;
ALTER TABLE stats_played DROP CONSTRAINT played_fk_seid_session_fkey;
ALTER TABLE stats_requested DROP COLUMN fk_seid;
ALTER TABLE stats_played DROP COLUMN fk_seid;
ALTER TABLE stats_played ADD COLUMN session_started_at timestamptz;
ALTER TABLE stats_requested ADD COLUMN session_started_at timestamptz;
ALTER TABLE stats_played ADD COLUMN pk_id_played integer;
ALTER TABLE stats_requested ADD COLUMN pk_id_requested integer;

DROP TABLE stats_session;

CREATE UNIQUE INDEX idx_played_iid_startedat_kid_playedat ON stats_requested (fk_iid, session_started_at, fk_kid, requested_at);
CREATE UNIQUE INDEX idx_requested_iid_startedat_kid_playedat ON stats_played (fk_iid, session_started_at, fk_kid, played_at);
