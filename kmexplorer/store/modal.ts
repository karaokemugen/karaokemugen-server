import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

export type ModalType = 'auth' |
	'profile' |
	'addRepo' |
	'deleteAccount' |
	'joinKara' |
	'stats' |
	'karaSuggest' |
	'download' |
	'banner' |
	'createEditPlaylist' |
	'deletePlaylist' |
	'addDuplicateInPlaylist' |
	'addBans';

export type modalStoreType = {
	auth: boolean;
	profile: boolean;
	addRepo: boolean;
	deleteAccount: boolean;
	joinKara: boolean;
	stats: boolean;
	karaSuggest: boolean;
	download: boolean;
	banner: boolean;
	createEditPlaylist: boolean;
	deletePlaylist: boolean;
	addDuplicateInPlaylist: boolean;
	addBans: boolean;
}

export const useModalStore = defineStore('modal', {
	state: () : modalStoreType => {
		const authStore = useAuthStore();
		return {
			auth: false,
			profile: false,
			addRepo: false,
			deleteAccount: false,
			joinKara: false,
			karaSuggest: false,
			download: false,
			banner: false,
			createEditPlaylist: false,
			deletePlaylist: false,
			addDuplicateInPlaylist: false,
			addBans: false,
			stats : authStore.loggedIn && authStore.user?.flag_sendstats === null
		};
	},
	getters: {},
	actions: {
		openModal(type: ModalType) {
			this[type] = true;
		},
		closeModal(type: ModalType) {
			this[type] = false;
		},
		closeAll() {
			this.auth =  false;
			this.profile =  false;
			this.addRepo = false;
			this.deleteAccount = false;
			this.joinKara = false;
			this.karaSuggest = false;
			this.download = false;
			this.banner = false;
			this.createEditPlaylist = false;
			this.deletePlaylist = false;
			this.addDuplicateInPlaylist = false;
			this.addBans = false;
		}
	},
	persist: true
});
