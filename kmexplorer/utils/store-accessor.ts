import { Store } from 'vuex';
import { getModule } from 'vuex-module-decorators';
import menubar from '../store/menubar';
import modal from '../store/modal';
import likes from '../store/likes';

let menuBarStore: menubar;
let modalStore: modal;
let likesStore: likes;

function initialiseStores(store: Store<any>): void {
	menuBarStore = getModule(menubar, store);
	modalStore = getModule(modal, store);
	likesStore = getModule(likes, store);
}

export { initialiseStores, menuBarStore, modalStore, likesStore };
