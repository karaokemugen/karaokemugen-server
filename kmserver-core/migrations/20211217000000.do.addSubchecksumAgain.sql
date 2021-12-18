CREATE TABLE kara_subchecksum (
	fk_kid UUID PRIMARY KEY,
	subchecksum TEXT,
	FOREIGN KEY(fk_kid) REFERENCES kara(pk_kid) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_kara_subchecksum_kid ON kara_subchecksum(fk_kid);