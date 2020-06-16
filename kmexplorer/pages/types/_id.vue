<template>
	<div class="tags" v-if="type">
		<tag v-for="tag in tags.content" :key="tag.tid" :type="type" :tag="tag" :i18n="tag.i18n" />
	</div>
</template>

<script lang="ts">
import Vue from "vue";
import Tag from "~/components/Tag.vue";
import { tagTypes } from "../../assets/constants";

export default Vue.extend({
	name: "ListTag",
	components: {
		Tag
	},

	data() {
		return {
			tags: {
				infos: { count: 0, from: 0, to: 0 },
				content: []
			},
			loading: false
		};
	},

	methods: {},

	validate({ params }) {
		return params.id && tagTypes[params.id];
	},

	async asyncData({ params, $axios, error, app }) {
		const { data } = await $axios
			.get(`/api/karas/tags/${tagTypes[params.id].type}`)
			.catch(_err =>
				error({ statusCode: 404, message: app.i18n.t("tag.notfound") })
			);
		console.log(params.id)
		return { tags: data, type: params.id };
	},

	transition: "fade",

	watch: {
		loading(now, _old) {
			if (now) this.$nuxt.$loading.start();
			else this.$nuxt.$loading.finish();
		}
	}
});
</script>