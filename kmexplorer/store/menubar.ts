import { Module, VuexModule, Mutation } from 'vuex-module-decorators'
import { Tag } from "%/lib/types/tag";

interface TagExtend {
	type?: string,
	tag?: Tag
}

@Module({
    name: 'menubar',
    stateFactory: true,
    namespaced: true,
})
export default class MenuBar extends VuexModule {
    tag: TagExtend|null = {}

    search: string|null = ''

	sort: string = 'az'

    @Mutation
    setTag(tag: TagExtend|null) {
        this.tag = tag;
    }

    @Mutation
    setSearch(search: string|null) {
        this.search = search;
    }

    @Mutation
	setSort(sort: string) {
    	this.sort = sort;
	}
}
