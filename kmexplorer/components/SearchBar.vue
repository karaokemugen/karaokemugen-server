<template>
	<div class="field is-expanded has-addons">
		<div
			v-if="results"
			class="control"
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
			:class="{'has-icons-left': icon}"
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
			class="control"
		>
			<button class="button is-static">
				{{ $t('layout.results', {count: resultsCount}) }}
			</button>
		</div>
		<div
			v-if="filter"
			class="control"
		>
			<span class="select">
				<select
					v-model="sort"
					:aria-label="$t('search.aria.sort')"
					:disabled="!canSort"
				>
					<option
						value="az"
						selected
					>{{ $t('search.sort.a_z') }}</option>
					<template v-if="route.name === 'types-id'">
						<option value="karacount">{{ $t('search.sort.kara_count') }}</option>
					</template>
					<template v-else-if="route.name === 'suggest'">
						<option value="likes">{{ $t('search.sort.likes') }}</option>
						<option value="language">{{ $t('search.sort.languages') }}</option>
					</template>
					<template v-else>
						<option value="recent">{{ $t('search.sort.recent') }}</option>
						<option value="played">{{ $t('search.sort.most_played') }}</option>
						<option value="favorited">{{ $t('search.sort.most_favorites') }}</option>
						<option value="requested">{{ $t('search.sort.most_requested') }}</option>
					</template>
				</select>
			</span>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import { useMenubarStore } from '~/store/menubar';

	const { sort, resultsCount, search: menuSearch } = storeToRefs(useMenubarStore());
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

	const canCount = computed(() => ['types-id', 'search-query', 'user-login', 'users', 'types-years'].includes(route.name as string));
	const canSort = computed(() => ['types-id', 'search-query', 'user-login', 'users', 'types-years'].includes(route.name as string));
	const canSearch = computed(() => ['types-id', 'search-query', 'user-login', 'users', 'types-years', 'suggest'].includes(route.name as string));
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
	.field.is-expanded {
		flex-grow: 1;
		flex-shrink: 0;

		.select select option {
			color: white;
		}

		.select select[disabled] {
			color: #849496;
			border-color: unset;
			box-shadow: unset;
			background-color: #36393f;
		}
	}
	.search-icon {
		display: block;
		padding: 8px;
	}
</style>
