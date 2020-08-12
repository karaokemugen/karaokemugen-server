<template>
	<div class="is-ancestor">
		<loading-nanami v-if="$fetchState.pending" />
		<div v-if="years.length > 0" class="tags">
			<nuxt-link
				v-for="tag in years"
				:key="tag.year"
				:to="`/years/${tag.year}`"
				class="tag is-medium"
			>
				<font-awesome-icon :icon="['fas', 'calendar-alt']" :fixed-width="true" />
				{{ tag.year }}&nbsp;<span class="karacount">({{ tag.karacount }})</span>
			</nuxt-link>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';

	import LoadingNanami from '~/components/LoadingNanami.vue';
	import { DBYear } from '%/lib/types/database/kara';

	interface VState {
		years: DBYear[]
	}

	export default Vue.extend({
		name: 'ListYears',

		components: {
			LoadingNanami
		},

		async fetch() {
			const res = await this.$axios
				.get<DBYear[]>('/api/karas/years/')
				.catch(_err =>
					this.$nuxt.error({ statusCode: 404, message: this.$t('tag.notfound') as string })
				);
			if (res) {
				this.years = res.data;
			} else {
				this.$nuxt.error({ statusCode: 500, message: 'Huh?' });
			}
		},

		data(): VState {
			return {
				years: []
			};
		}
	});
</script>

<style scoped lang="scss">
	span.karacount {
		font-size: 0.8em;
		opacity: 0.6;
	}
</style>
