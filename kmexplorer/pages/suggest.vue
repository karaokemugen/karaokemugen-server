<template>
	<div>
		<section>
			<div class="hero-body">
				<div class="cell is-12 is-hidden-desktop">
					<search-languages class="mb-2" />
					<search-bar />
					<div class="field is-expanded mt-2">
						<languages-picker :label="$t('search.types.suggestions')" />
					</div>
				</div>
				<div class="container">
					<h1 class="title">
						{{ $t('suggestions.header.title') }}
					</h1>
					<h2 class="subtitle is-underlined">
						<nuxt-link @click.prevent="openHideSuggestionModal">
							{{ $t('suggestions.header.description') }}
						</nuxt-link>
					</h2>
					<h2 class="subtitle is-hidden-touch ">
						{{ $t('suggestions.header.purpose') }}
						<span v-if="gitlab">{{ $t('suggestions.header.suggestion') }}</span>
					</h2>
					<button
						class="button is-primary m-1"
						:class="{ 'is-loading': loading }"
						@click="fetchRandomKaras"
					>
						<span class="icon"><font-awesome-icon :icon="['fas', 'dice']" /></span>
						<span>{{ $t('suggestions.header.random_selection') }}</span>
					</button>
					<button
						v-if="gitlab"
						class="button is-success m-1"
						@click="() => openModal('karaSuggest')"
					>
						<span class="icon"><font-awesome-icon :icon="['fas', 'plus']" /></span>
						<span>{{ $t('suggestions.header.send_suggestion') }}</span>
					</button>
				</div>
			</div>
		</section>
		<div class="container">
			<pagination
				v-if="total > 1"
				:page="page"
				:last-page="total"
				@page="setPage"
			/>
			<suggest-card
				v-for="kara in karas.content"
				:key="kara.id"
				:kara="kara"
			/>
			<pagination
				v-if="total > 1"
				:page="page"
				:last-page="total"
				@page="setPage"
			/>
		</div>
		<first-time-suggest-modal
			v-if="!loading"
			:active="!hideSuggestionModal"
			@close="() => setHideSuggestionModal()"
		/>
		<kara-suggest-modal
			v-if="!loading && gitlab"
			:active="karaSuggest"
			@close="() => closeModal('karaSuggest')"
		/>
	</div>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import { useMenubarStore } from '~/store/menubar';
	import { useModalStore } from '~/store/modal';
	import { useLocalStorageStore } from '~/store/localStorage';
	import type { Suggestion } from '~/../kmserver-core/src/types/suggestions';

	type SuggestList = {
		content: Suggestion[]
		infos: {
			count: number
			from: number
			to: number
		}
	}

	const numberKaraokesByPage = 10;

	const loading = ref(true);
	const page = ref(1);
	const total = ref(1);
	const karas = ref<SuggestList>({
		infos: { count: 0, from: 0, to: 0 },
		content: []
	});

	const { search, sort, enabledLanguages } = storeToRefs(useMenubarStore());
	const { setSearch } = useMenubarStore();
	const { hideSuggestionModal } = storeToRefs(useLocalStorageStore());
	const { setHideSuggestionModal, openHideSuggestionModal } = useLocalStorageStore();
	const { karaSuggest } = storeToRefs(useModalStore());
	const { closeModal, openModal } = useModalStore();

	const conf = useRuntimeConfig();
	const gitlab = conf.public.GITLAB;

	const route = useRoute();

	watch(enabledLanguages, () => setPage(1), { deep: true });
	watch(search, () => setPage(1));
	watch(sort, () => setPage(1), { deep: true });

	onBeforeMount(() => {
		setSearch('');
		if (typeof route.query.q === 'string') {
			setSearch(route.query.q);
		}
		if (typeof route.query.page === 'string') {
			page.value = parseInt(route.query.page);
		}

		fetchRandomKaras();
	});

	onBeforeUnmount(() => setSearch(''));

	async function fetchRandomKaras() {
		loading.value = true;
		total.value = 0;
		const res = await useCustomFetch<SuggestList>('/api/suggestions/random', {
			params: {
				size: 5,
				'languages[]': enabledLanguages.value
			}
		});
		karas.value = res;
		loading.value = false;
	}
	async function fetchPage(page: number) {
		const res = await useCustomFetch<SuggestList>('/api/suggestions', {
			params: {
				page,
				filter: search.value ? search.value : undefined,
				size: numberKaraokesByPage,
				from: (page - 1) * numberKaraokesByPage,
				order: sort.value[route.name],
				'languages[]': enabledLanguages.value
			}
		});
		karas.value = res;
		total.value = res.content.length > 0 && res.content[0].count ? Math.ceil(res.content[0].count / numberKaraokesByPage) : 0;
		loading.value = false;
	}
	function setPage(e: number) {
		page.value = e;
		fetchPage(e);
	}
</script>
