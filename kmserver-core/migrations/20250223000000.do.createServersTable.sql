CREATE TABLE server (
	domain TEXT NOT NULL,
	sid UUID NOT NULL,
	last_seen TIMESTAMPTZ NOT NULL,
	flag_banned BOOLEAN
);

CREATE UNIQUE INDEX idx_server_domain ON server(domain);
CREATE UNIQUE INDEX idx_server_sid ON server(sid);
CREATE UNIQUE INDEX idx_server_domain_sid ON server(domain, sid);
