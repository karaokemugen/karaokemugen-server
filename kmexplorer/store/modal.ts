import { Module, VuexModule, Mutation } from 'vuex-module-decorators'

@Module({
	name: 'modal',
	stateFactory: true,
	namespaced: true,
})
export default class Modal extends VuexModule {
	auth: false

	@Mutation
	openModal(type) {
		this[type] = true;
	}

	@Mutation
	closeModal(type) {
		this[type] = false;
	}
}
