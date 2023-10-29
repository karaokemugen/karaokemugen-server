<template>
	<div class="field is-expanded has-addons">
		<div
			v-if="results && resultsCount > 0 && canCount"
			class="control is-expanded"
		>
			<button class="button is-static">
				{{ $t('layout.results', {count: resultsCount}) }}
			</button>
		</div>
		<div class="control">
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
						<option value="playedRecently">{{ $t('search.sort.most_played_recently') }}</option>
						<option value="favorited">{{ $t('search.sort.most_favorites') }}</option>
						<option value="requested">{{ $t('search.sort.most_requested') }}</option>
						<option value="requestedRecently">{{ $t('search.sort.most_requested_recently') }}</option>
					</template>
				</select>
			</span>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import { useMenubarStore } from '~/store/menubar';

	const { resultsCount, sort } = storeToRefs(useMenubarStore());
	const route = useRoute();
	const $t = useI18n().t;

	withDefaults(defineProps<{
		results?: boolean
	}>(), {
		results: true
	});

	const canCount = computed(() => ['types-id', 'search-query', 'user-login', 'users', 'types-years'].includes(route.name as string));
	const canSort = computed(() => ['types-id', 'search-query', 'user-login', 'suggest'].includes(route.name as string));
</script>

<style scoped lang="scss">
	.field.is-expanded {
		flex-grow: 1;
		flex-shrink: 0;

		.button.is-static {
			width: 100%;
		}

		.select select option {
			color: #dbdee0;
		}

		.select select[disabled] {
			color: #849496;
			border-color: unset;
			box-shadow: unset;
			background-color: #36393f;
		}
	}
</style>
