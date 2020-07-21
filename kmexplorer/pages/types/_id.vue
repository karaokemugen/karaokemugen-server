<template>
	<div class="is-ancestor">
		<pagination :page="page" :last-page="total" @page="setPage"></pagination>

		<div class="tags" v-if="tags.content.length > 0">
			<tag
				v-for="tag in tags.content"
				:key="tag.tid"
				:icon="true"
				:type="type"
				:tag="tag"
				:i18n="tag.i18n"
				:showkaracount="true"
			/>
		</div>
		<pagination :page="page" :last-page="total" @page="setPage"></pagination>

		<loading-nanami class="tile is-parent is-12" v-if="loading"></loading-nanami>
	</div>
</template>

<script lang="ts">
	import Vue from "vue";
	import Tag from "~/components/Tag.vue";
	import {Tag as TagType} from '%/lib/types/tag';
	import {tagTypesMap, tagTypes} from "~/assets/constants";
	import LoadingNanami from "~/components/LoadingNanami.vue";
	import Pagination from "~/components/Pagination.vue";

	interface VState {
		tagTypesMap: typeof tagTypesMap,
		tags: {
			infos: {count: number, from: number, to: number},
			content: TagType[]
		},
		page: number,
		loading: boolean,
		total: number,
		type: number
	}

	export default Vue.extend({
		name: "ListTag",
		components: {
			LoadingNanami,
			Tag,
			Pagination
		},

		data(): VState {
			return {
				tagTypesMap,
				tags: {
					infos: {count: 0, from: 0, to: 0},
					content: []
				},
				page: 1,
				loading: false,
				total: 1,
				type: -1
			};
		},

		methods: {
			async setPage(e: number): Promise<void> {
				this.page = e;
				this.loading = true;
				const {data} = await this.$axios.get(
					`/api/karas/tags/${tagTypes[this.type].type}`,
					{
						params: {
							from: (this.page - 1) * 100,
							size: 100
						}
					}
				);
				data.content = data.content.filter(
					tag => tag.karacount && Object.keys(tag.karacount).length > 0
				);
				this.tags = data;
				this.loading = false;
			}
		},

		validate({params}) {
			return typeof tagTypes[params.id] === 'object';
		},

		async asyncData({params, $axios, error, app}) {
			const res = await $axios
				.get(`/api/karas/tags/${tagTypes[params.id].type}`, {
					params: {
						from: 0,
						size: 100
					}
				})
				.catch(_err =>
					error({statusCode: 404, message: app.i18n.t("tag.notfound") as string})
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
				error({statusCode: 500, message: 'Huh?'});
			}
		},

		watch: {
			loading(now, _old) {
				if (now) this.$nuxt.$loading.start();
				else this.$nuxt.$loading.finish();
			}
		}
	});
</script>
