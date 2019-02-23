ALTER TABLE tag ADD COLUMN slug CHARACTER VARYING;

CREATE UNIQUE INDEX idx_tag_type_slug ON tag (tagtype, slug);