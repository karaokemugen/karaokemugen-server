<template>
	<div class="is-ancestor">
		<div class="tags" v-if="years.length > 0">
			<nuxt-link :to="nolink ? ``:`/years/${tag.year}`" v-for="tag in years" class="tag is-medium"
					   :key="tag.year">
				<font-awesome-icon :icon="['fas', 'calendar-alt']" :fixed-width="true"/>
				{{ tag.year }} <label>&nbsp;({{ tag.karacount }})</label>
			</nuxt-link>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue from "vue";
	import {DBYear} from "%/lib/types/database/kara";

	interface VState {
		years: DBYear[]
	}

	export default Vue.extend({
		name: "ListTag",

		data(): VState {
			return {
				years: [],
			};
		},

		async asyncData({$axios, error, app}) {
			const res = await $axios
				.get('/api/karas/years/')
				.catch(_err =>
					error({statusCode: 404, message: app.i18n.t("tag.notfound") as string})
				);
			if (res) {
				return {years: res.data};
			} else {
				error({statusCode: 500, message: 'Huh?'});
			}
		}
	});
</script>
