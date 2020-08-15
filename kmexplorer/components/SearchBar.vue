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
		<div v-if="resultsCount > 0 && ['search-query', 'types-id'].includes($route.name)" class="control">
			<button class="button is-static">
				{{ $tc('layout.results', resultsCount, {count: resultsCount}) }}
			</button>
		</div>
		<div class="control">
			<span class="select">
				<select v-model="sort" :aria-label="$t('search.aria.sort')" :disabled="!canSort">
					<option value="az" selected>{{ $t('search.sort.a_z') }}</option>
					<template v-if="['types-id', 'types-years'].includes(this.$route.name)">
						<option value="karacount">{{ $t('search.sort.kara_count') }}</option>
					</template>
					<template v-else>
						<option value="recent">{{ $t('search.sort.recent') }}</option>
						<option value="most_played">{{ $t('search.sort.most_played') }}</option>
						<option value="most_favorites">{{ $t('search.sort.most_favorites') }}</option>
						<option value="most_requested">{{ $t('search.sort.most_requested') }}</option>
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

		data(): VState {
			return {
				search: '',
				sort: 'recent'
			};
		},

		computed: {
			canSort(): boolean {
				return ['types-id', 'types-years', 'search-query', 'tags-slug-id'].includes(this.$route.name as string);
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
				}
			});
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
