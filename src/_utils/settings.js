// This is to store/get settings/data from database

import {selectSettings, upsertSetting} from '../_dao/settings';

export async function getSettings() {
	const settings = {};
	const settingsArray = await selectSettings();
	for (const data of settingsArray) {
		settings[data.setting] = data.setting_value;
	}
	return settings;
}

export async function updateSetting(setting, value) {
	return await upsertSetting(setting, value);
}