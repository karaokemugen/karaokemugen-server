CREATE INDEX IF NOT EXISTS idx_akt_type_tid_kid ON all_kara_tag (type, fk_tid, fk_kid);
CREATE INDEX IF NOT EXISTS idx_akt_tid          ON all_kara_tag (fk_tid);
CREATE INDEX IF NOT EXISTS idx_akt_kid          ON all_kara_tag (fk_kid);

CREATE INDEX IF NOT EXISTS idx_at_name   ON all_tags (name);
CREATE INDEX IF NOT EXISTS idx_at_types  ON all_tags USING gin (types);
CREATE INDEX IF NOT EXISTS idx_at_search ON all_tags USING gin (tag_search_vector);

-- Nominal case, so it goes faster when doing normal queries
CREATE INDEX IF NOT EXISTS idx_at_name_nostaging
    ON all_tags (name) WHERE repository != 'Staging';