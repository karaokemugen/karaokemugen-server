INSERT INTO stats_session(pk_seid,
						  fk_iid,
						  name,
						  started_at)
VALUES('ffffffff-ffff-ffff-ffff-ffffffffffff',
	   (SELECT COALESCE ((SELECT pk_iid FROM instance WHERE version = 'Server'),
						'00000000-0000-0000-0000-000000000000')), 'Server Player session', '2023-09-10');