import { defineStore } from 'pinia';
import { Tag } from '%/lib/types/tag';
import { DBTag } from '%/lib/types/database/tag';
import { DBKaraTag } from '%/lib/types/database/kara';

export interface TagExtend {
	type: string,
	tag: Tag | DBTag | DBKaraTag
}

export type sortTypes = 'az' | 'karacount' | 'recent' | 'played' | 'favorited' | 'requested' | 'likes' | 'language';

export type menubarStoreType = {
	tags: TagExtend[];
	search: string;
	sort: sortTypes;
	resultsCount: number;
	enabledLanguages: string[];

}

export const useMenubarStore = defineStore('menubar', {
	state: (): menubarStoreType => {
		return {
			tags: [],
			search: '',
			sort: 'recent',
			resultsCount: 0,
			enabledLanguages: []
		};
	},
	getters: {},
	actions: {
		addTag(tag: TagExtend) {
			if (!this.tags.some(val => val.tag.tid === tag.tag.tid && val.type === tag.type)) {
				if (tag.type === 'years') {
					this.tags = this.tags.filter(val => val.type !== 'years');
				}
				this.tags.push(tag);
			}
		},
		removeTag(tag: TagExtend) {
			this.tags.splice(this.tags.indexOf(tag), 1);
		},
		clearTags() {
			this.tags = [];
		},
		setTags(tags: TagExtend[]) {
			this.tags = tags;
		},
		setSearch(search: string) {
			this.search = search;
		},
		setSort(sort: sortTypes) {
			this.sort = sort;
		},
		setResultsCount(count: number) {
			this.resultsCount = count;
		},
		setEnabledLanguages(languages: string[]) {
			this.enabledLanguages = languages;
		},
		reset() {
			this.resultsCount = 0;
			this.search = '';
			this.tags = [];
			this.sort = 'recent';
		}
	},
	persist: {
		storage: persistedState.sessionStorage
	}
});
