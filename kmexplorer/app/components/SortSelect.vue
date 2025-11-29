<template>
	<div
		v-if="filter && canSort"
		class="control"
	>
		<span class="select">
			<select
				v-model="sortModel"
				:aria-label="$t('search.aria.sort')"
			>
				<template v-if="route.name === 'types-id'">
					<option
						value="az"
						selected
					>{{ $t('search.sort.a_z') }}</option>
					<option value="karacount">{{ $t('search.sort.kara_count') }}</option>
				</template>
				<template v-if="route.name === 'types-years'">
					<option
						value="recent"
						selected
					>{{ $t('search.sort.recent') }}</option>
					<option value="karacount">{{ $t('search.sort.kara_count') }}</option>
				</template>
				<template v-else-if="route.name === 'suggest'">
					<option
						value="az"
						selected
					>{{ $t('search.sort.a_z') }}</option>
					<option value="likes">{{ $t('search.sort.likes') }}</option>
					<option value="language">{{ $t('search.sort.languages') }}</option>
				</template>
				<template v-else-if="route.name === 'user-login-submissions'">
					<option
						value="az"
						selected
					>{{ $t('search.sort.a_z') }}</option>
					<option value="recentModified">{{ $t('search.sort.recent_modified') }}</option>
					<option value="status">{{ $t('search.sort.status') }}</option>
				</template>
				<template v-else-if="route.name === 'playlists'">
					<option
						value="az"
						selected
					>{{ $t('search.sort.a_z') }}</option>
					<option value="recent">{{ $t('search.sort.recent') }}</option>
					<option value="karacount">{{ $t('search.sort.kara_count') }}</option>
					<option value="duration">{{ $t('search.sort.duration') }}</option>
					<option value="username">{{ $t('search.sort.username') }}</option>
				</template>
				<template v-else-if="['search-query', 'user-login', 'user-login-animelist'].includes(route.name as string)">
					<option
						value="az"
						selected
					>{{ $t('search.sort.a_z') }}</option>
					<option value="recent">{{ $t('search.sort.recent') }}</option>
					<option value="played">{{ $t('search.sort.most_played') }}</option>
					<option value="playedRecently">{{ $t('search.sort.most_played_recently') }}</option>
					<option value="favorited">{{ $t('search.sort.most_favorites') }}</option>
					<option value="requested">{{ $t('search.sort.most_requested') }}</option>
					<option value="requestedRecently">{{ $t('search.sort.most_requested_recently') }}</option>
				</template>
			</select>
		</span>
	</div>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import { defaultSort, useMenubarStore } from '~/store/menubar';
	import type { sortTypes } from '~/store/menubar';

	const { sort } = storeToRefs(useMenubarStore());
	const { setSort } = useMenubarStore();
	const route = useRoute();
	const $t = useI18n().t;

	defineProps<{
		filter: boolean
	}>();

	const sortModel = computed({
		get(): sortTypes {
			return sort.value[route.name as string] as sortTypes;
		},
		set(sort: sortTypes) {
			setSort(sort);
		}
	});

	const canSort = computed(() => Object.keys(defaultSort).includes(route.name as string));
</script>

<style scoped lang="scss">
	.select select option {
		color: #dbdee0;
	}
</style>
