import { Module, VuexModule, Mutation } from 'vuex-module-decorators'

export type ModalType = 'auth' | 'profile';

@Module({
	name: 'modal',
	stateFactory: true,
	namespaced: true,
})
export default class Modal extends VuexModule {
	auth: boolean = false
	profile: boolean = false

	@Mutation
	openModal(type: ModalType) {
		this[type] = true;
	}

	@Mutation
	closeModal(type: ModalType) {
		this[type] = false;
	}
}
