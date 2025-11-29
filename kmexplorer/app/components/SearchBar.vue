<template>
	<div class="field is-expanded has-addons">
		<div
			v-if="results && !(route.name as string).includes('playlist') 
				&& route.name !== 'user-login-submissions'"
			class="control is-hidden-touch"
		>
			<collections-picker
				v-if="route.name !== 'suggest'"
				:label="searchLabel"
			/>
			<languages-picker
				v-if="route.name === 'suggest'"
				:label="searchLabel"
			/>
		</div>
		<div
			class="control is-expanded"
			:class="{ 'has-icons-left': icon }"
		>
			<input
				v-model="search"
				class="input is-fullwidth"
				type="search"
				:placeholder="placeholder"
				@keydown.enter="triggerSearch"
			>
			<div
				v-if="icon"
				class="icon is-small is-left search-icon"
			>
				<font-awesome-icon :icon="['fas', 'search']" />
			</div>
		</div>
		<div
			v-if="results && resultsCount > 0 && canCount"
			class="control is-hidden-touch"
		>
			<button class="button is-static">
				{{ $t('layout.results', { count: resultsCount }) }}
			</button>
		</div>
		<sort-select
			:filter="filter"
			class="is-hidden-touch"
		/>
	</div>
	<div class="field is-expanded has-addons is-hidden-desktop">
		<div
			v-if="results && resultsCount > 0 && canCount"
			class="control is-expanded"
		>
			<button class="button is-static">
				{{ $t('layout.results', {count: resultsCount}) }}
			</button>
		</div>
		<sort-select
			:filter="filter"
		/>
	</div>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import { useMenubarStore } from '~/store/menubar';

	const { resultsCount, search: menuSearch } = storeToRefs(useMenubarStore());
	const { setSearch } = useMenubarStore();
	const route = useRoute();
	const { push } = useRouter();
	const $t = useI18n().t;

	const search = ref<string>('');

	withDefaults(defineProps<{
		results?: boolean
		filter?: boolean
		icon?: boolean
	}>(), {
		results: true,
		filter: true,
		icon: true
	});

	const canCount = computed(() => ['types-id', 'types-years', 'search-query', 'user-login', 'user-login-animelist', 'users', 'suggest', 'playlists'].includes(route.name as string));
	const canSearch = computed(() => ['types-id', 'types-years', 'search-query', 'user-login', 'user-login-animelist', 'users', 'suggest', 'playlists', 'playlist-slug', 'user-login-submissions'].includes(route.name as string));
	const searchLabel = computed((): string => {
		if (route.name === 'users') {
			return $t('search.types.users') as string;
		} else if (route.name === 'user-login') {
			return $t('search.types.favorites') as string;
		} else if (route.name === 'suggest') {
			return $t('search.types.suggestions') as string;
		} else if (['types-id', 'types-years'].includes(route.name as string)) {
			return $t(`menu.${route.name === 'types-years' ? 'years' : route.params.id}`) as string;
		} else {
			return $t('search.types.karaokes') as string;
		}
	});
	const placeholder = computed((): string => {
		if (route.name === 'users') {
			return $t('search.placeholder.user') as string;
		} else if (route.name === 'user-login-submissions') {
			return $t('search.placeholder.submissions') as string;
		} else if (route.name === 'playlists') {
			return $t('search.placeholder.playlist') as string;
		} else if (['types-id', 'types-years'].includes(route.name as string)) {
			return $t('search.placeholder.tag') as string;
		} else {
			return $t('search.placeholder.kara') as string;
		}
	});

	watch(menuSearch, (now) => search.value = now, { immediate: true });

	function triggerSearch() {
		setSearch(search.value);
		if (!canSearch.value) {
			push('/search');
		}
	}
</script>

<style scoped lang="scss">
	.field:not(:last-child) {
		margin-bottom: 0
	}

	.field.is-expanded {
		flex-grow: 1;
		flex-shrink: 0;

		.select select option {
			color: #dbdee0;
		}

		&.is-hidden-desktop .button.is-static {
			width: 100%;
		}
	}
	.search-icon {
		display: block;
		padding: 8px;
	}
</style>
