<template>
	<div class="tile is-ancestor">
		<div class="tile is-vertical">
			<div class="tile is-parent is-12 is-hidden-desktop">
				<search-tags />
				<search-bar :filter="false" :results="false" />
				<search-edit />
			</div>

			<div v-if="total > 1" class="tile is-parent is-12">
				<pagination :page="page" :last-page="total" @page="setPage" />
			</div>

			<div class="tile is-parent is-12">
				<div v-if="tags.content.length > 0" class="tags">
					<tag
						v-for="tag in tags.content"
						:key="tag.tid"
						icon
						:type="$route.params.id"
						:tag="tag"
						:i18n="tag.i18n"
						showkaracount
					/>
				</div>
			</div>

			<div v-if="total > 1" class="tile is-parent is-12">
				<pagination v-if="total > 1" :page="page" :last-page="total" @page="setPage" />
			</div>

			<loading-nanami v-if="loading || $fetchState.pending" class="tile is-parent is-12" />
		</div>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import { mapState } from 'vuex';

	import Tag from '~/components/Tag.vue';
	import LoadingNanami from '~/components/LoadingNanami.vue';
	import Pagination from '~/components/Pagination.vue';
	import SearchEdit from '~/components/SearchEdit.vue';
	import SearchBar from '~/components/SearchBar.vue';
	import SearchTags from '~/components/SearchTags.vue';
	import { tagTypes } from '~/assets/constants';
	import { menuBarStore } from '~/store';

	import { DBTag } from '%/lib/types/database/tag';
	import { TagList } from '%/lib/types/tag';

	interface TagsRequest {
		from: number,
		size: number,
		order?: string,
		filter?: string,
		stripEmpty?: boolean,
		collections?: string
	}

	interface VState {
		tags: TagList,
		page: number,
		loading: boolean,
		total: number
	}

	export default Vue.extend({
		name: 'ListTag',

		components: {
			LoadingNanami,
			Tag,
			Pagination,
			SearchEdit,
			SearchBar,
			SearchTags
		},

		validate({ params }) {
			return typeof tagTypes[params.id] === 'object';
		},

		data(): VState {
			return {
				tags: {
					infos: { count: 0, from: 0, to: 0 },
					content: []
				},
				page: 1,
				loading: false,
				total: 1
			};
		},

		async fetch() {
			const res = await this.$axios
				.get<TagList>(`/api/karas/tags/${tagTypes[this.$route.params.id].type}`, {
					params: this.reqParams
				})
				.catch(_err =>
					this.$nuxt.error({ statusCode: 404, message: this.$t('tag.notfound') as string })
				);
			if (res && res.data) {
				this.total = res.data.content.length > 0 ? Math.ceil(res.data.content[0].count / 100) : 0;
				this.tags = res.data;
			} else {
				this.$nuxt.error({ statusCode: 500, message: 'Huh?' });
			}
		},

		computed: {
			reqParams(): TagsRequest {
				return {
					from: (this.page - 1) * 100,
					size: 100,
					order: this.sort,
					stripEmpty: true,
					filter: this.search || undefined,
					collections: this.enabledCollections.join(',') || undefined
				};
			},
			...mapState('menubar', ['search', 'sort', 'enabledCollections'])
		},

		watch: {
			loading(now) {
				if (now) { this.$nuxt.$loading.start(); } else { this.$nuxt.$loading.finish(); }
			},
			sort() {
				this.setPage(1);
			},
			search() {
				this.setPage(1);
			},
			tags(now) {
				menuBarStore.setResultsCount(now.infos.count);
			}
		},

		beforeCreate() {
			if (this.$nuxt.context.from?.fullPath.includes('/search')) {
				menuBarStore.setSearch('');
			}
			if (!['az', 'karacount'].includes(menuBarStore.sort)) {
				// Reset sort to karacount
				menuBarStore.setSort('karacount');
			}
		},

		methods: {
			async setPage(e: number): Promise<void> {
				this.page = e;
				this.loading = true;
				const { data } = await this.$axios.get<TagList>(
					`/api/karas/tags/${tagTypes[this.$route.params.id].type}`,
					{
						params: this.reqParams
					}
				);
				data.content = data.content.filter(
					(tag: DBTag) => tag.karacount && Object.keys(tag.karacount).length > 0
				);
				this.total = data.content.length > 0 ? Math.ceil(data.content[0].count / 100) : 0;
				this.tags = data;
				this.loading = false;
			}
		}
	});
</script>
