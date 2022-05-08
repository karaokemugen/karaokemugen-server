<template>
	<div class="is-ancestor">
		<loading-nanami v-if="$fetchState.pending" />
		<div v-if="tags.length > 0" class="tags">
			<tag
				v-for="tag in tags"
				:key="tag.name"
				:tag="tag"
				type="years"
				icon
				showkaracount
			/>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';

	import LoadingNanami from '~/components/LoadingNanami.vue';
	import Tag from '~/components/Tag.vue';
	import { DBYear } from '%/lib/types/database/kara';
	import { fakeYearTag } from '~/utils/tools';
	import { Tag as TagType } from '%/lib/types/tag';
	import { menuBarStore } from '~/store';
	import { mapState } from 'vuex';

	interface VState {
		years: DBYear[]
	}

	export default Vue.extend({
		name: 'ListYears',

		components: {
			LoadingNanami,
			Tag
		},

		data(): VState {
			return {
				years: []
			};
		},

		async fetch() {
			const res = await this.$axios
				.get<DBYear[]>('/api/karas/years/', {
					params: {
						collections: menuBarStore.enabledCollections.join(',')
					}
				})
				.catch(_err =>
					this.$nuxt.error({ statusCode: 404, message: this.$t('tag.notfound') as string })
				);
			if (res) {
				this.years = res.data;
				menuBarStore.setResultsCount(res.data.length);
			} else {
				this.$nuxt.error({ statusCode: 500, message: 'Huh?' });
			}
		},

		computed: {
			tags(): TagType[] {
				const tags: TagType[] = [];
				for (const year of this.years) {
					tags.push(fakeYearTag(year.year.toString(), year.karacount));
				}
				return tags;
			},
			...mapState('menubar', ['enabledCollections'])
		},

		watch: {
			enabledCollections() {
				this.setPage();
			}
		},

		methods: {
			async setPage(): Promise<void> {
				const res = await this.$axios.get<DBYear[]>('/api/karas/years/', {
					params: {
						collections: menuBarStore.enabledCollections.join(',')
					}
				});
				this.years = res.data;
				menuBarStore.setResultsCount(res.data.length);
			}
		}
	});
</script>

<style scoped lang="scss">
	span.karacount {
		font-size: 0.8em;
		opacity: 0.6;
	}
</style>
