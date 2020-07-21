import {Store} from 'vuex';
import {getModule} from 'vuex-module-decorators';
import menubar from "../store/menubar";
import modal from "../store/modal";

let menuBarStore: menubar;
let modalStore: modal;

function initialiseStores(store: Store<any>): void {
	menuBarStore = getModule(menubar, store);
	modalStore = getModule(modal, store);
}

export {initialiseStores, menuBarStore, modalStore}
