<template>
	<div class="is-ancestor">
		<pagination :page="page" :last-page="total" @page="setPage" />

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
		<pagination :page="page" :last-page="total" @page="setPage" />

		<loading-nanami v-if="loading" class="tile is-parent is-12" />
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';

	import Tag from '~/components/Tag.vue';
	import { tagTypesMap, tagTypes } from '~/assets/constants';
	import LoadingNanami from '~/components/LoadingNanami.vue';
	import Pagination from '~/components/Pagination.vue';
	import { menuBarStore } from '~/store';

	import { Tag as TagType } from '%/lib/types/tag';
	import { DBTag } from '%/lib/types/database/tag';

	interface TagsRequest {
		from: number,
		size: number,
		order?: string,
		filter?: string
	}

	interface VState {
		tagTypesMap: typeof tagTypesMap,
		tags: {
			infos: { count: number, from: number, to: number },
			content: DBTag[]
		},
		sort: string,
		page: number,
		loading: boolean,
		total: number,
		type: number,
		VuexUnsubscribe?: Function
	}

	export default Vue.extend({
		name: 'ListTag',
		components: {
			LoadingNanami,
			Tag,
			Pagination
		},

		async asyncData({ params, $axios, error, app }) {
			const res = await $axios
				.get(`/api/karas/tags/${tagTypes[params.id].type}`, {
					params: {
						from: 0,
						size: 100,
						stripEmpty: true
					}
				})
				.catch(_err =>
					error({ statusCode: 404, message: app.i18n.t('tag.notfound') as string })
				);
			if (res && res.data) {
				res.data.content = res.data.content.filter(
					(tag: TagType) => tag.karacount && Object.keys(tag.karacount).length > 0
				);
				return {
					tags: res.data,
					type: params.id,
					total: res.data.content.length > 0 && Math.ceil(res.data.content[0].count / 100)
				};
			} else {
				error({ statusCode: 500, message: 'Huh?' });
			}
		},

		data(): VState {
			return {
				tagTypesMap,
				tags: {
					infos: { count: 0, from: 0, to: 0 },
					content: []
				},
				sort: 'az',
				page: 1,
				loading: false,
				total: 1,
				type: -1
			};
		},

		computed: {
			reqParams(): TagsRequest {
				return {
					from: (this.page - 1) * 100,
					size: 100,
					order: this.sort
				};
			}
		},

		watch: {
			loading(now, _old) {
				if (now) { this.$nuxt.$loading.start(); } else { this.$nuxt.$loading.finish(); }
			},
			sort(_now, _old) {
				this.setPage(1);
			}
		},

		activated() {
			if (!['az', 'karacount'].includes(this.sort)) {
				// Reset sort to karacount
				menuBarStore.setSort('karacount');
				this.sort = 'karacount';
			}
			this.VuexUnsubscribe = this.$store.subscribe((mutation, _payload) => {
				if (mutation.type === 'menubar/setSort') {
					this.sort = mutation.payload;
				}
			});
		},

		destroyed() {
			// No need to unsubscribe on deactivated, it's only to refresh the sort mode
			if (this.VuexUnsubscribe) { this.VuexUnsubscribe(); }
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
