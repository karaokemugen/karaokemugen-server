import { Module, VuexModule, Mutation } from 'vuex-module-decorators';

@Module({
	name: 'likes',
	stateFactory: true,
	namespaced: true
})
export default class Likes extends VuexModule {
	karas = [] as number[];

	@Mutation
	addKara(id: number) {
		this.karas.push(id);
	}
};
