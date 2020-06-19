import { Module, VuexModule, Mutation } from 'vuex-module-decorators'
import {Tag} from "../../src/lib/types/tag";

@Module({
    name: 'menubar',
    stateFactory: true,
    namespaced: true,
})
export default class MenuBar extends VuexModule {
    tag: {
        type: string,
        tag: Tag
    }

    search: string

	sort: string

    @Mutation
    setTag(tag) {
        this.tag = tag;
    }

    @Mutation
    setSearch(search) {
        this.search = search;
    }

    @Mutation
	setSort(sort) {
    	this.sort = sort;
	}
}
