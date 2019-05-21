// Settings SQL

export const upsertSetting = `
INSERT INTO settings (
	option,
	value
) VALUES($1, $2)
ON CONFLICT (option) DO UPDATE SET
	value = $2;
`

export const selectSettings = 'SELECT option, value FROM settings;'