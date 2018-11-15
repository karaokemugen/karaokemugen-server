export const upsertInstance = `
INSERT INTO instance(
	modified_at,
	instance_id,
	version,
	locale,
	screens,
	cpu_manufacturer,
	cpu_model,
	cpu_speed,
	cpu_cores,
	memory,
	total_disk_space,
	os_platform,
	os_distro,
	os_release,
	config)
	VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
	ON CONFLICT (instance_id) DO UPDATE SET
	modified_at = $1,
	version = $3,
	locale = $4,
	screens = $5,
	cpu_manufacturer = $6,
	cpu_model = $7,
	cpu_speed = $8,
	cpu_cores = $9
	memory = $10,
	total_disk_space = $11,
	os_platform = $12,
	os_distro = $13,
	os_release = $14,
	config = $15;
`;

export const deleteFavorites = `
DELETE FROM favorite
WHERE fk_id_instance = (SELECT pk_id_instance FROM instance WHERE instance_id = $1);
`;

export const insertFavorite = `
INSERT INTO favorite(fk_id_instance, kid)
VALUES(
	(SELECT pk_id_instance FROM instance WHERE instance_id = $1),
	$2
)
`;

export const insertViewcount = `
INSERT INTO played(fk_id_instance, kid, session_started_at, played_at)
VALUES(
	(SELECT pk_id_instance FROM instance WHERE instance_id = $1),
	$2,
	$3,
	$4
)
ON CONFLICT (fk_id_instance, kid, session_started_at, played_at) DO NOTHING;
`;

export const insertRequested = `
INSERT INTO requested(fk_id_instance, kid, session_started_at, requested_at)
VALUES(
	(SELECT pk_id_instance FROM instance WHERE instance_id = $1),
	$2,
	$3,
	$4
)
ON CONFLICT (fk_id_instance, kid, session_started_at, requested_at) DO NOTHING;
`;