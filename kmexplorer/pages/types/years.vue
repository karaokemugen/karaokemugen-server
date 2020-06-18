<template>
	<div class="is-ancestor">
		<div class="tags" v-if="years.length > 0">
			<nuxt-link :to="nolink ? ``:`/years/${tag.year}`" v-for="tag in years" class="tag is-medium" :key="tag.year">
				<font-awesome-icon :icon="['fas', 'calendar-alt']" :fixed-width="true" />
				{{ tag.year }} <label>&nbsp;({{ tag.karacount }})</label>
			</nuxt-link>
		</div>
		<loading-nanami class="tile is-parent is-12" v-if="loading"></loading-nanami>
	</div>
</template>

<script lang="ts">
import Vue from "vue";
import LoadingNanami from "../../components/LoadingNanami";

export default Vue.extend({
	name: "ListTag",
	components: {
		LoadingNanami
	},

	data() {
		return {
			years: [],
			loading: false
		};
	},

	methods: {
	},

	async asyncData({ params, $axios, error, app }) {
		const { data } = await $axios
			.get('/api/karas/years/')
			.catch(_err =>
				error({ statusCode: 404, message: app.i18n.t("tag.notfound") })
			);
		return { years: data };
	},

    watch: {
		loading(now, _old) {
			if (now) this.$nuxt.$loading.start();
			else this.$nuxt.$loading.finish();
		}
	}
});
</script>