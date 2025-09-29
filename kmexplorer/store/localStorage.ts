export type LocalStorageStoreType = {
	karas: number[]
	hideSuggestionModal: boolean
	enabledCollections: string[]
	playerVolume: number
	autoplay: boolean
	banner: boolean,
	playlistBannerHidden: string[]
}


export const useLocalStorageStore = defineStore('localStorage', {
	state: (): LocalStorageStoreType => {
		return {
			karas: [],
			hideSuggestionModal: false,
			enabledCollections: [],
			playerVolume: 0.5,
			autoplay: false,
			banner: true,
			playlistBannerHidden: []
		};
	},
	getters: {},
	actions: {
		addKara(id: number) {
			this.karas.push(id);
		},
		setEnabledCollections(collecs?: string[]) {
			// Don't allow no collections
			if (collecs && collecs.length > 0) {
				this.enabledCollections = collecs;
			}
		},
		openHideSuggestionModal() {
			this.hideSuggestionModal = false;
		},
		setHideSuggestionModal() {
			this.hideSuggestionModal = true;
		},
		setPlayerVolume(volume: number) {
			this.playerVolume = volume;
		},
		setAutoplay(autoplay: boolean) {
			this.autoplay = autoplay;
		},
		hideBanner() {
			this.banner = false;
		},
		hidePlaylistBanner(plaid: string) {
			this.playlistBannerHidden.push(plaid);
		}
	},
	persist: {
		storage: piniaPluginPersistedstate.localStorage()
	}
});
