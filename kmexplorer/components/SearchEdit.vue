<template>
	<div class="field is-expanded has-addons">
		<div v-if="results && resultsCount > 0 && ['search-query', 'types-id', 'types-years', 'user-login', 'users'].includes($route.name)" class="control is-expanded">
			<button class="button is-static">
				{{ $tc('layout.results', resultsCount, {count: resultsCount}) }}
			</button>
		</div>
		<div class="control">
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
		sort: sortTypes,
		VuexUnsubscribe?: Function
	}

	export default Vue.extend({
		name: 'SearchEdit',

		props: {
			results: {
				type: Boolean,
				default: true
			}
		},

		data(): VState {
			return {
				sort: 'recent'
			};
		},

		computed: {
			canSort(): boolean {
				return ['types-id', 'search-query', 'user-login'].includes(this.$route.name as string);
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
				if (mutation.type === 'menubar/setSort') {
					this.sort = mutation.payload;
				}
			});
		},

		destroyed() {
			if (this.VuexUnsubscribe) { this.VuexUnsubscribe(); }
		}
	});
</script>

<style scoped lang="scss">
	.field.is-expanded {
		flex-grow: 1;
		flex-shrink: 0;

		.button.is-static {
			width: 100%;
		}

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
