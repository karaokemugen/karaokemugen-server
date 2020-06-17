import { Store } from 'vuex';
import { getModule } from 'vuex-module-decorators';
import menubar from "../store/menubar";

let menuBarStore: menubar;

function initialiseStores(store: Store<any>):void {
    menuBarStore = getModule(menubar, store);
}

export { initialiseStores, menuBarStore }