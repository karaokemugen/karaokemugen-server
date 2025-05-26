import type { Config } from '~/../kmserver-core/src/types/config';

export type supportedFilesType = {
	video: string[];
	audio: string[];
	lyrics: string[];
};

export type configStoreType = {
	config?: Config;
	supportedFiles?: supportedFilesType;
};

export const useConfigStore = defineStore('config', {
	state: (): configStoreType => {
		return {
			config: undefined,
			supportedFiles: undefined
		};
	},
	getters: {},
	actions: {
		setConfig(config: Config) {
			this.config = config;
		},
		setSupportedFiles(supportedFiles: supportedFilesType) {
			this.supportedFiles = supportedFiles;
		},
	},
	persist: {
		storage: piniaPluginPersistedstate.sessionStorage(),
	},
});
