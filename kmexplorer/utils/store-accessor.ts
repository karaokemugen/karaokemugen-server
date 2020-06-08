import { Store } from 'vuex';
import { getModule } from 'vuex-module-decorators';
import auth from '../store/auth';
import menubar from "../store/menubar";

let authStore: auth;
let menuBarStore: menubar;

function initialiseStores(store: Store<any>):void {
    authStore = getModule(auth, store);
    menuBarStore = getModule(menubar, store);
}

export { initialiseStores, authStore, menuBarStore }