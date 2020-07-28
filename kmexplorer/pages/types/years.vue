<template>
	<div class="is-ancestor">
		<div v-if="years.length > 0" class="tags">
			<nuxt-link
				v-for="tag in years"
				:key="tag.year"
				:to="nolink ? ``:`/years/${tag.year}`"
				class="tag is-medium"
			>
				<font-awesome-icon :icon="['fas', 'calendar-alt']" :fixed-width="true" />
				{{ tag.year }} <label>&nbsp;({{ tag.karacount }})</label>
			</nuxt-link>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import { DBYear } from '%/lib/types/database/kara';

	interface VState {
		years: DBYear[]
	}

	export default Vue.extend({
		name: 'ListTag',

		async asyncData({ $axios, error, app }) {
			const res = await $axios
				.get('/api/karas/years/')
				.catch(_err =>
					error({ statusCode: 404, message: app.i18n.t('tag.notfound') as string })
				);
			if (res) {
				return { years: res.data };
			} else {
				error({ statusCode: 500, message: 'Huh?' });
			}
		},

		data(): VState {
			return {
				years: []
			};
		}
	});
</script>
