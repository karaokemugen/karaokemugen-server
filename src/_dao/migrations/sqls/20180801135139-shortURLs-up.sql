CREATE TABLE short_url
(
    pk_id_shorturl smallserial NOT NULL,
	modified_at timestamp NOT NULL,
	remote_ip inet NOT NULL,
	local_ip inet NOT NULL,
	local_port integer DEFAULT(1337),
	instance_id uuid NOT NULL,
);