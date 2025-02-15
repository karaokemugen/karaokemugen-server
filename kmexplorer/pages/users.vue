<template>
	<div>
		<div class="cell is-12 is-hidden-desktop">
			<search-bar />
		</div>
		<div
			v-for="n in Math.ceil(users.content.length / 2)"
			:key="n"
			class="cell is-12"
		>
			<div
				v-for="n2 in 2"
				:key="`${n}_${n2}`"
				class="is-6"
			>
				<user-card
					v-if="users.content[(n - 1) * 2 + n2 - 1]"
					:user="users.content[(n - 1) * 2 + n2 - 1]"
				/>
			</div>
		</div>
		<loading-nanami
			v-if="loading"
			class="cell is-12"
		/>
		<div
			v-if="fullyLoaded"
			class="cell"
		>
			<div class="box">
				<h4 class="title is-4">
					{{ $t('layout.end_users') }}
				</h4>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import _ from 'lodash';
	import type { UserList } from '%/types/user';
	import { useMenubarStore } from '~/store/menubar';

	interface UsersRequest {
		filter?: string,
		from: number,
		size: number
	}

	const { search } = storeToRefs(useMenubarStore());
	const { setSearch, setResultsCount } = useMenubarStore();
	const conf = useRuntimeConfig();
	const usersEnabled = conf.public.USERS;

	const loading = ref(true);
	const mounted = ref(false);
	const from = ref(-1);
	const users = ref<UserList>({ infos: { count: 0, from: 0, to: 0 }, content: [] });

	setResultsCount(0);

	const fullyLoaded = computed(() => users.value.infos.to === users.value.infos.count);

	watch(search, () => resetList());
	watch(users, (users) => setResultsCount(users.infos.count), { deep: true });

	onBeforeMount(() => setSearch(''));

	onMounted(() => {
		mounted.value = true;
		window.addEventListener('scroll', scrollEvent, { passive: true });
		fillPage();
	});

	onUnmounted(() => {
		mounted.value = false;
		setSearch('');
		window.removeEventListener('scroll', scrollEvent);
	});

	await fetch();

	async function fetch() {
		if (!usersEnabled) {
			throw createError({ statusCode: 404 });
		}
		// Load the first page
		await resetList();
	}

	async function loadNextPage(force = false) {
		if (!force && (users.value.infos.to === users.value.infos.count || loading.value)) {
			return;
		}
		from.value++;
		loading.value = true;
		const data = await useCustomFetch<UserList>('/api/users', {
			query: reqParams()
		});
		for (let i = data.infos.from; i < data.infos.to; i++) {
			users.value.content[i] = data.content[i - data.infos.from];
		}

		users.value.infos.count = data.infos.count;
		users.value.infos.to = data.infos.to;
		loading.value = false;
	}

	function scrollEvent() {
		// trigger next page before the end of the page
		const bottomPosScroll = document.documentElement.scrollTop + window.innerHeight;
		const minPosToTriggerScroll = 400;
		const triggerNextPage = document.documentElement.offsetHeight - bottomPosScroll < Math.max(2 * window.innerHeight, minPosToTriggerScroll);

		if (triggerNextPage) {
			loadNextPage();
		}
	}

	function fillPage() {
		if (!mounted.value) {
			return;
		}
		setTimeout(async () => {
			if (document.documentElement.clientHeight >= document.documentElement.scrollHeight) {
				await loadNextPage();
			}
			fillPage();
		}, 100);
	}


	async function resetList() {
		users.value = { infos: { count: 0, to: 0, from: 0 }, content: [] };
		from.value = -1;
		await loadNextPage(true);
	}

	function reqParams(): UsersRequest {
		return {
			filter: search.value || undefined,
			from: (from.value * 12),
			size: 12,
		};
	}
</script>
