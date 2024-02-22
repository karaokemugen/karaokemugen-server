import { defineStore } from 'pinia';
import type { DBTag } from '%/lib/types/database/tag';

export interface TagExtend {
	type: string;
	tag: DBTag;
}

export type sortTypes = 'az' | 'karacount' | 'recent' | 'played' | 'favorited' | 'requested' | 'likes' | 'language';

export type menubarStoreType = {
	tags: TagExtend[];
	search: string;
	sort: Record<string, sortTypes>;
	resultsCount: number;
	enabledLanguages: string[];

}

export const useMenubarStore = defineStore('menubar', {
	state: (): menubarStoreType => {
		return {
			tags: [],
			search: '',
			sort: {
				'types-id': 'karacount',
				'types-years': 'recent',
				'search-query': 'recent',
				'user-login': 'recent',
				'user-login-animelist': 'recent',
				'users': 'az',
				'suggest': 'likes',
				'playlists': 'az'
			},
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
			const route = useRoute();
			this.sort[route.name] = sort;
		},
		setResultsCount(count: number) {
			this.resultsCount = count;
		},
		setEnabledLanguages(languages: string[]) {
			this.enabledLanguages = languages;
		},
		addEnabledLanguage(language: string) {
			if (this.enabledLanguages.indexOf(language) === -1) {
				this.enabledLanguages.push(language);
			}
		},
		removeLanguage(language: string) {
			this.enabledLanguages.splice(this.enabledLanguages.indexOf(language), 1);
		},
		reset() {
			this.resultsCount = 0;
			this.search = '';
			this.tags = [];
			this.sort = {
				'types-id': 'karacount',
				'types-years': 'recent',
				'search-query': 'recent',
				'user-login': 'recent',
				'user-login-animelist': 'recent',
				'users': 'az',
				'suggest': 'likes',
				'playlists': 'az'
			};
		}
	},
	persist: {
		storage: persistedState.sessionStorage
	}
});
