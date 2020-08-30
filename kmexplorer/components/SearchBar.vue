<template>
	<div class="field is-expanded has-addons">
		<div class="control is-expanded">
			<input
				v-model="search"
				class="input is-fullwidth"
				type="text"
				:placeholder="$t('search.placeholder')"
				@keydown.enter="triggerSearch"
			>
		</div>
		<div v-if="results && resultsCount > 0 && ['search-query', 'types-id', 'types-years', 'favorites'].includes($route.name)" class="control">
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
				return ['types-id', 'search-query', 'favorites'].includes(this.$route.name as string);
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
