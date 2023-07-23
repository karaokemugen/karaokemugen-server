import { defineStore } from 'pinia';

export type LocalStorageStoreType = {
	karas: number[]
	sendContactInfos: boolean
	hideSuggestionModal: boolean
	enabledCollections: string[]
	playerVolume: number
	autoplay: boolean
}


export const useLocalStorageStore = defineStore('localStorage', {
	state: (): LocalStorageStoreType => {
		return {
			karas: [],
			sendContactInfos: false,
			hideSuggestionModal: false,
			enabledCollections: useRuntimeConfig().public.DEFAULT_COLLECTIONS,
			playerVolume: 0.5,
			autoplay: false
		};
	},
	getters: {},
	actions: {
		addKara(id: number) {
			this.karas.push(id);
		},
		setEnabledCollections(collecs: string[]) {
			// Don't allow no collections
			if (collecs.length > 0) {
				this.enabledCollections = collecs;
			}
		},
		openHideSuggestionModal() {
			this.hideSuggestionModal = false;
		},
		setHideSuggestionModal() {
			this.hideSuggestionModal = true;
		},
		setSendContactInfos(sendContactInfos: boolean) {
			this.sendContactInfos = sendContactInfos;
		},
		setPlayerVolume(volume: number) {
			this.playerVolume = volume;
		},
		setAutoplay(autoplay: boolean) {
			this.autoplay = autoplay;
		}
	},
	persist: {
		storage: persistedState.localStorage
	}
});
