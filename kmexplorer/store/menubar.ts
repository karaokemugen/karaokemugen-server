import { Module, VuexModule, Mutation } from 'vuex-module-decorators';
import { Tag } from '%/lib/types/tag';
import { DBTag } from '%/lib/types/database/tag';
import { DBKaraTag } from '%/lib/types/database/kara';

export interface TagExtend {
	type: string,
	tag: Tag | DBTag | DBKaraTag
}

export type sortTypes = 'az' | 'karacount' | 'recent' | 'played' | 'favorited' | 'requested';

@Module({
	name: 'menubar',
	stateFactory: true,
	namespaced: true
})
export default class MenuBar extends VuexModule {
	tags: TagExtend[] = []

	search: string = ''

	sort: sortTypes = 'recent'

	resultsCount: number = 0

	@Mutation
	addTag(tag: TagExtend) {
		if (!this.tags.some(val => val.tag.tid === tag.tag.tid && val.type === tag.type)) {
			this.tags.push(tag);
		}
	}

	@Mutation
	removeTag(tag: TagExtend) {
		this.tags.splice(this.tags.indexOf(tag), 1);
	}

	@Mutation
	clearTags() {
		this.tags = [];
	}

	@Mutation
	setTags(tags: TagExtend[]) {
		this.tags = tags;
	}

	@Mutation
	setSearch(search: string) {
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
