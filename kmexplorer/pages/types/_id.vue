<template>
	<div class="is-ancestor">
		<div class="tags" v-if="type">
			<tag v-for="tag in tags.content" :key="tag.tid" :type="type" :tag="tag" :i18n="tag.i18n" />
		</div>
		<loading-nanami class="tile is-parent is-12" v-if="loading"></loading-nanami>
	</div>
</template>

<script lang="ts">
import Vue from "vue";
import Tag from "~/components/Tag.vue";
import { tagTypes } from "../../assets/constants";
import LoadingNanami from "../../components/LoadingNanami";

export default Vue.extend({
	name: "ListTag",
	components: {
		LoadingNanami,
		Tag
	},

	data() {
		return {
			tags: {
				infos: { count: 0, from: 0, to: 0 },
				content: []
			},
			from: 0,
			loading: false
		};
	},

	methods: {
		async loadNextPage() {
			console.log("load")
			if (this.tags.infos.to === this.tags.infos.count || this.loading)
				return ;
			this.from++;
			this.loading = true;
			const { data } = await this.$axios.get(`/api/karas/tags/${tagTypes[this.type].type}`, {
				params: {
					from: this.from * 400,
					size: (this.from + 1) * 400
				}
			});
			this.tags.content.push(...data.content);
			this.tags.infos.to = data.infos.to;
			this.loading = false;
		},
		scrollEvent() {
			window.addEventListener("scroll", () => {
				let bottomOfWindow =
					document.documentElement.scrollTop + window.innerHeight >
					document.documentElement.offsetHeight - 400;

				if (bottomOfWindow) {
					this.loadNextPage();
				}
			});
		}
	},

	validate({ params }) {
		return params.id && tagTypes[params.id];
	},

	async asyncData({ params, $axios, error, app }) {
		const { data } = await $axios
			.get(`/api/karas/tags/${tagTypes[params.id].type}`, {
                params: {
                    from: 0,
                    size: 400
                }
            })
			.catch(_err =>
				error({ statusCode: 404, message: app.i18n.t("tag.notfound") })
			);
		return { tags: data, type: params.id };
	},

	mounted() {
		this.scrollEvent();
	},

	watch: {
		loading(now, _old) {
			if (now) this.$nuxt.$loading.start();
			else this.$nuxt.$loading.finish();
		}
	}
});
</script>