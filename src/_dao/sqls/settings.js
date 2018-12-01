// Settings SQL

export const upsertSetting = `
INSERT INTO settings (
	setting,
	setting_value
) VALUES($1, $2)
ON CONFLICT (setting) DO UPDATE SET
	setting_value = $2;
`

export const selectSettings = 'SELECT setting, setting_value FROM settings;'