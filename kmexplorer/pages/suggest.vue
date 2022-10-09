<template>
	<div>
		<section>
			<div class="hero-body">
				<div class="tile is-parent is-12 is-hidden-desktop">
					<search-bar :filter="false" :results="false" />
					<search-edit />
					<div class="field is-expanded">
						<languages-picker :label="$t('search.types.suggestions')" />
					</div>
				</div>
				<div class="container">
					<h1 class="title">
						{{ $t('suggestions.header.title') }}
					</h1>
					<h2 class="subtitle is-underlined">
						<a @click.prevent="modal.suggestPurpose = true">{{ $t('suggestions.header.description') }}</a>
					</h2>
					<h2 class="subtitle">
						{{ $t('suggestions.header.purpose') }}
					</h2>
					<button class="button is-primary" :class="{'is-loading': loading}" @click="fetchRandomKaras">
						<span class="icon"><font-awesome-icon :icon="['fas', 'dice']" /></span>
						<span>{{ $t('suggestions.header.random_selection') }}</span>
					</button>
					<button class="button is-success" @click="modal.karaSuggest = true">
						<span class="icon"><font-awesome-icon :icon="['fas', 'plus']" /></span>
						<span>{{ $t('suggestions.header.send_suggestion') }}</span>
					</button>
				</div>
			</div>
		</section>
		<div class="container">
			<pagination v-if="total > 1" :page="page" :last-page="total" @page="setPage" />
			<suggest-card v-for="kara in karas.content" :key="kara.id" :kara="kara" />
			<pagination v-if="total > 1" :page="page" :last-page="total" @page="setPage" />
		</div>
		<first-time-suggest-modal :active="modal.suggestPurpose" @close="modal.suggestPurpose=false" />
		<kara-suggest-modal v-if="!loading" :active="modal.karaSuggest" @close="modal.karaSuggest=false" />
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import { mapState } from 'vuex';
	import SuggestCard from '~/components/SuggestCard.vue';
	import FirstTimeSuggestModal from '~/components/modals/FirstTimeSuggestModal.vue';
	import Pagination from '~/components/Pagination.vue';
	import KaraSuggestModal from '~/components/modals/KaraSuggestModal.vue';
	import { menuBarStore } from '~/utils/store-accessor';
	import LanguagesPicker from '~/components/LanguagesPicker.vue';
	import SearchBar from '~/components/SearchBar.vue';
	import SearchEdit from '~/components/SearchEdit.vue';

	const numberKaraokesByPage = 10;

	export default Vue.extend({
		name: 'SuggestSearch',

		components: {
			SuggestCard,
			FirstTimeSuggestModal,
			Pagination,
			KaraSuggestModal,
			LanguagesPicker,
			SearchBar,
			SearchEdit
		},

		data() {
			return {
				loading: true,
				page: 1,
				total: 1,
				karas: {
					infos: { count: 0, from: 0, to: 0 },
					content: []
				},
				modal: {
					suggestPurpose: (process.client && !window.localStorage.hideSuggestionModal) || false,
					karaSuggest: false
				}
			};
		},

		computed: {
			...mapState('menubar', ['search', 'sort', 'enabledLanguages'])
		},

		watch: {
			loading(now, _old) {
				if (now) {
					this.$nuxt.$loading.start();
				} else {
					this.$nuxt.$loading.finish();
				}
			},
			enabledLanguages() {
				this.setPage(1);
			},
			search() {
				this.setPage(1);
			},
			sort() {
				this.setPage(1);
			}
		},

		beforeCreate() {
			menuBarStore.setSearch('');
			menuBarStore.setSort('likes');
		},

		mounted() {
			this.$nextTick(() => {
				this.$nuxt.$loading.start();
			});
			this.fetchRandomKaras();
		},

		created() {
			if (typeof this.$route.query.q === 'string') { this.search = this.$route.query.q; }
			if (typeof this.$route.query.sort === 'string') { this.sort = this.$route.query.sort; }
			if (typeof this.$route.query.page === 'string') { this.page = parseInt(this.$route.query.page); }
		},

		methods: {
			async fetchRandomKaras() {
				this.loading = true;
				this.total = 0;
				const res = await this.$axios.get('/api/suggestions/random', {
					params: {
						size: 5,
						languages: menuBarStore.enabledLanguages
					}
				});
				this.karas = res.data;
				this.loading = false;
			},
			async fetchPage(page: number) {
				const res = await this.$axios.get('/api/suggestions', {
					params: {
						page,
						filter: this.search ? this.search : undefined,
						size: numberKaraokesByPage,
						from: (this.page - 1) * numberKaraokesByPage,
						order: this.sort,
						languages: menuBarStore.enabledLanguages
					}
				});
				this.karas = res.data;
				this.total = res.data.content.length > 0 ? Math.ceil(res.data.content[0].count / numberKaraokesByPage) : 0;
				this.loading = false;
			},
			setPage(e: number) {
				this.page = e;
				this.fetchPage(e);
			}
		}

	});
</script>
