<template>
	<b-dropdown v-model="enabledCollections" aria-role="list" multiple>
		<template #trigger="{ active }">
			<button class="button">
				<font-awesome-icon fixed-width :icon="['fas', active ? 'chevron-up':'chevron-down']" />
				{{ label }}
			</button>
		</template>
		<p>{{ $t('layout.collections') }}</p>

		<b-dropdown-item v-for="collection in collections" :key="collection.tid" :value="collection.tid" aria-role="listitem">
			{{ localName(collection) }} ({{ localDesc(collection) }})
		</b-dropdown-item>
	</b-dropdown>
</template>

<script lang="ts">
	import Vue from 'vue';
	import { DBTag } from '%/lib/types/database/tag';
	import { menuBarStore } from '~/store';
	import { getDescriptionInLocale, getTagInLocale } from '~/utils/tools';

	interface VState {
		collections: DBTag[]
	}

	export default Vue.extend({
		name: 'CollectionsPicker',

		props: {
			label: {
				type: String,
				required: true
			}
		},

		data(): VState {
			return {
				collections: []
			};
		},

		async fetch() {
			const collections = await this.$axios.$get('/api/karas/tags', {
				params: {
					type: 16
				}
			});
			this.collections = collections.content as DBTag[];
		},

		computed: {
			enabledCollections: {
				get(): string[] {
					return menuBarStore.enabledCollections;
				},
				set(collecs: string[]) {
					menuBarStore.setEnabledCollections(collecs);
				}
			}
		},

		methods: {
			localName(tag: DBTag) {
				return getTagInLocale(tag, this.$store.state.auth.user);
			},
			localDesc(tag: DBTag) {
				return getDescriptionInLocale(tag, this.$store.state.auth.user);
			}
		}
	});
</script>

<style scoped>
.dropdown-content > p {
	padding: .5em 1em;
	min-width: 18em;
}
.dropdown-item {
	font-size: 0.9rem;
}
</style>
