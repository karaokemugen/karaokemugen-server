<template>
	<div class="field is-expanded has-addons">
		<div v-if="results" class="control">
			<button class="button is-static with-icon">
				{{ searchLabel }}
			</button>
		</div>
		<div class="control is-expanded" :class="{'has-icons-left': icon}">
			<input
				class="input is-fullwidth"
				type="text"
				:placeholder="placeholder"
				:value="search"
				@keydown.enter="triggerSearch"
				@input="keyDown"
			>
			<span v-if="icon" class="icon is-small is-left">
				<font-awesome-icon :icon="['fas', 'search']" />
			</span>
		</div>
		<div v-if="results && resultsCount > 0 && ['search-query', 'types-id', 'types-years', 'user-login', 'users'].includes($route.name)" class="control">
			<button class="button is-static">
				{{ $tc('layout.results', resultsCount, {count: resultsCount}) }}
			</button>
		</div>
		<div v-if="filter" class="control">
			<span class="select">
				<select v-model="sort" :aria-label="$t('search.aria.sort')" :disabled="!canSort">
					<option value="az" selected>{{ $t('search.sort.a_z') }}</option>
					<template v-if="$route.name === 'types-id'">
						<option value="karacount">{{ $t('search.sort.kara_count') }}</option>
					</template>
					<template v-else>
						<option value="recent">{{ $t('search.sort.recent') }}</option>
						<option value="played">{{ $t('search.sort.most_played') }}</option>
						<option value="favorited">{{ $t('search.sort.most_favorites') }}</option>
						<option value="requested">{{ $t('search.sort.most_requested') }}</option>
					</template>
				</select>
			</span>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import { mapState } from 'vuex';
	import { menuBarStore } from '~/store';
	import { sortTypes } from '~/store/menubar';

	interface VState {
		search: string,
		sort: sortTypes,
		VuexUnsubscribe?: Function
	}

	export default Vue.extend({
		name: 'SearchBar',

		props: {
			results: {
				type: Boolean,
				default: true
			},
			filter: {
				type: Boolean,
				default: true
			},
			icon: {
				type: Boolean,
				default: false
			}
		},

		data(): VState {
			return {
				search: '',
				sort: 'recent'
			};
		},

		computed: {
			canSort(): boolean {
				return ['types-id', 'search-query', 'user-login'].includes(this.$route.name as string);
			},
			searchLabel(): string {
				if (this.$route.name === 'users') {
					return this.$t('search.types.users') as string;
				} else if (this.$route.name === 'user-login') {
					return this.$t('search.types.favorites') as string;
				} else if (['types-id', 'types-years'].includes(this.$route.name as string)) {
					return this.$t(`menu.${this.$route.name === 'types-years' ? 'years' : this.$route.params.id}`) as string;
				} else {
					return this.$t('search.types.karaokes') as string;
				}
			},
			placeholder(): string {
				if (this.$route.name === 'users') {
					return this.$t('search.placeholder.user') as string;
				} else if (['types-id', 'types-years'].includes(this.$route.name as string)) {
					return this.$t('search.placeholder.tag') as string;
				} else {
					return this.$t('search.placeholder.kara') as string;
				}
			},
			...mapState('menubar', ['resultsCount'])
		},

		watch: {
			sort(now, _old) {
				menuBarStore.setSort(now);
			}
		},

		mounted() {
			this.VuexUnsubscribe = this.$store.subscribe((mutation, _state) => {
				if (mutation.type === 'menubar/setSearch') {
					this.search = mutation.payload;
				} else if (mutation.type === 'menubar/setSort') {
					this.sort = mutation.payload;
				} else if (mutation.type === 'menubar/reset') {
					this.sort = 'recent';
					this.search = '';
				}
			});
			this.search = menuBarStore.search;
			this.sort = menuBarStore.sort;
		},

		destroyed() {
			if (this.VuexUnsubscribe) { this.VuexUnsubscribe(); }
		},

		methods: {
			triggerSearch() {
				menuBarStore.setSearch(this.search);
			},
			keyDown(e: KeyboardEvent) {
				this.search = (e.target as HTMLInputElement).value;
			}
		}
	});
</script>

<style scoped lang="scss">
	.field.is-expanded {
		flex-grow: 1;
		flex-shrink: 0;

		.select select option {
			color: white;
		}

		.select select[disabled] {
			color: #849496;
			border-color: unset;
			box-shadow: unset;
			background-color: #36393f;
		}
	}
</style>
