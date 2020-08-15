<template>
	<div class="is-ancestor">
		<pagination v-if="total > 1" :page="page" :last-page="total" @page="setPage" />

		<div v-if="tags.content.length > 0" class="tags">
			<tag
				v-for="tag in tags.content"
				:key="tag.tid"
				icon
				:type="type"
				:tag="tag"
				:i18n="tag.i18n"
				showkaracount
			/>
		</div>
		<pagination v-if="total > 1" :page="page" :last-page="total" @page="setPage" />

		<loading-nanami v-if="loading || $fetchState.pending" class="tile is-parent is-12" />
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import { mapState } from 'vuex';

	import Tag from '~/components/Tag.vue';
	import { tagTypesMap, tagTypes } from '~/assets/constants';
	import LoadingNanami from '~/components/LoadingNanami.vue';
	import Pagination from '~/components/Pagination.vue';
	import { menuBarStore } from '~/store';

	import { DBTag } from '%/lib/types/database/tag';
	import { TagList } from '%/lib/types/tag';

	interface TagsRequest {
		from: number,
		size: number,
		order?: string,
		filter?: string
	}

	interface VState {
		tagTypesMap: typeof tagTypesMap,
		tags: TagList,
		page: number,
		loading: boolean,
		total: number,
		type: string
	}

	export default Vue.extend({
		name: 'ListTag',
		components: {
			LoadingNanami,
			Tag,
			Pagination
		},

		async fetch() {
			const res = await this.$axios
				.get<TagList>(`/api/karas/tags/${tagTypes[this.$route.params.id].type}`, {
					params: {
						from: 0,
						size: 100,
						stripEmpty: true,
						filter: this.search || ''
					} as TagsRequest
				})
				.catch(_err =>
					this.$nuxt.error({ statusCode: 404, message: this.$t('tag.notfound') as string })
				);
			if (res && res.data) {
				this.type = this.$route.params.id;
				this.total = res.data.content.length > 0 ? Math.ceil(res.data.content[0].count / 100) : 0;
				this.tags = res.data;
			} else {
				this.$nuxt.error({ statusCode: 500, message: 'Huh?' });
			}
		},

		data(): VState {
			return {
				tagTypesMap,
				tags: {
					infos: { count: 0, from: 0, to: 0 },
					content: []
				},
				page: 1,
				loading: false,
				total: 1,
				type: ''
			};
		},

		computed: {
			reqParams(): TagsRequest {
				return {
					from: (this.page - 1) * 100,
					size: 100,
					order: this.sort,
					filter: this.search || undefined
				};
			},
			...mapState('menubar', ['search', 'sort'])
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

		mounted() {
			if (!['az', 'karacount'].includes(this.sort)) {
				// Reset sort to karacount
				menuBarStore.setSort('karacount');
			}
		},

		methods: {
			async setPage(e: number): Promise<void> {
				this.page = e;
				this.loading = true;
				const { data } = await this.$axios.get(
					`/api/karas/tags/${tagTypes[this.type].type}`,
					{
						params: this.reqParams
					}
				);
				data.content = data.content.filter(
					(tag: DBTag) => tag.karacount && Object.keys(tag.karacount).length > 0
				);
				this.tags = data;
				this.loading = false;
			}
		},

		validate({ params }) {
			return typeof tagTypes[params.id] === 'object';
		}
	});
</script>
