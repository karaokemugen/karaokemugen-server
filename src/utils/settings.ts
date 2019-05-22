// This is to store/get settings/data from database

import {selectSettings, upsertSetting} from '../dao/settings';

export async function getSettings() {
	const settings = {};
	const settingsArray = await selectSettings();
	for (const data of settingsArray) {
		settings[data.option] = data.value;
	}
	return settings;
}

export async function updateSetting(setting: string, value: string) {
	return await upsertSetting(setting, value);
}