import type { DBTag } from '%/lib/types/database/tag';
import type { Config } from '~/../kmserver-core/src/types/config';

export type supportedFilesType = {
	video: string[];
	audio: string[];
	lyrics: string[];
};

export type configStoreType = {
	config?: Config;
	supportedFiles?: supportedFilesType;
	collections: DBTag[];
};

export const useConfigStore = defineStore('config', {
	state: (): configStoreType => {
		return {
			config: undefined,
			supportedFiles: undefined,
			collections: [],
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
		setCollections(collections: DBTag[]) {
			this.collections = collections;
		},
	},
	persist: {
		storage: piniaPluginPersistedstate.sessionStorage(),
	},
});
