import { Module, VuexModule, Mutation } from 'vuex-module-decorators';
import { Tag } from '%/lib/types/tag';

export interface TagExtend {
	type?: string,
	tag?: Tag
}

export type sortTypes = 'az' | 'karacount' | 'recent' | 'most_played' | 'most_favorites' | 'most_requested';

@Module({
	name: 'menubar',
	stateFactory: true,
	namespaced: true
})
export default class MenuBar extends VuexModule {
	tag: TagExtend | null = {}

	search: string | null = ''

	sort: sortTypes = 'recent'

	resultsCount: number = 0

	@Mutation
	setTag(tag: TagExtend | null) {
		this.tag = tag;
	}

	@Mutation
	setSearch(search: string | null) {
		this.search = search;
	}

	@Mutation
	setSort(sort: sortTypes) {
		this.sort = sort;
	}

	@Mutation
	setResultsCount(count: number) {
		this.resultsCount = count;
	}
}
