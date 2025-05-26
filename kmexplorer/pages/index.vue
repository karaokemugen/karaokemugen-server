<template>
	<div class="km-home">
		<nuxt-link href="https://karaokes.moe/">
			<picture class="km-home--logo">
				<source
					type="image/webp"
					src="~/assets/km-logo.webp"
				>
				<source
					type="image/png"
					src="/assets/km-logo.png"
				>
				<img
					src="~/assets/km-logo.png"
					alt="Logo"
				>
			</picture>
		</nuxt-link>
		<h1
			class="title"
			:title="$t('modal.add_repository.label')"
			@click.prevent="() => openModal('addRepo')"
		>
			{{ $t('modal.add_repository.button') }}
			{{ requestUrl.hostname }}
			<nuxt-link href="#">
				<font-awesome-icon
					:icon="['fas', 'folder-plus']"
					:fixed-width="true"
				/>
			</nuxt-link>
		</h1>
		<h2 class="subtitle">
			{{ config?.KaraExplorer.Tagline }}
		</h2>
		<nuxt-link
			class="button is-success button-play"
			@click.prevent="openRandomKara"
		>
			<font-awesome-icon
				:icon="['fas', 'circle-play']"
				:fixed-width="true"
			/>
			{{ $t('menu.play_random_song') }}
		</nuxt-link>
		<div class="is-hidden-mobile">
			<label
				class="label"
				for="token"
			>
				{{ $t('modal.join_kara.desc') }}
			</label>
			<div class="field has-addons">
				<div class="control is-expanded">
					<input
						id="token"
						v-model="token"
						type="text"
						name="token"
						class="input"
					>
				</div>
				<div class="control">
					<button
						class="button is-success"
						@click.prevent="joinKara"
					>
						<font-awesome-icon
							:icon="['fas', 'person-booth']"
							:fixed-width="true"
						/> {{ $t('modal.join_kara.label') }}
					</button>
				</div>
			</div>
			<p class="help">
				{{ $t('modal.join_kara.help') }}
			</p>
			<p
				v-if="error"
				class="help is-danger"
			>
				{{ $t('modal.join_kara.error') }}
			</p>
		</div>
		<div class="mobile-search-bar is-hidden-desktop">
			<button
				class="button is-success"
				@click.prevent="() => openModal('joinKara')"
			>
				<font-awesome-icon
					:icon="['fas', 'person-booth']"
					:fixed-width="true"
				/> {{ $t('modal.join_kara.label') }}
			</button>
			<search-bar
				:filter="false"
				:results="false"
				icon
			/>
		</div>
		<ul class="km-home--stats">
			<li>
				<nuxt-link
					to="/search"
					class="km-home--stats--link"
				>
					<strong>{{ count ? `${count.karas} ` : '- ' }}</strong>
					<span>{{ $t("stats.karaokes", count?.karas ?? 0) }}</span>
				</nuxt-link>
			</li>
			<li>
				<nuxt-link
					to="/types/series"
					class="km-home--stats--link"
				>
					<strong>{{ count ? `${count.series} ` : '- ' }}</strong>
					<span>{{ $t("kara.tagtypes.series", count?.series ?? 0) }}</span>
				</nuxt-link>
			</li>
			<li>
				<nuxt-link
					to="/types/singers"
					class="km-home--stats--link"
				>
					<strong>{{ count ? `${count.singers} ` : '- ' }}</strong>
					<span>{{ $t("kara.tagtypes.singers", count?.singers ?? 0) }}</span>
				</nuxt-link>
			</li>
			<li>
				<nuxt-link
					to="/types/creators"
					class="km-home--stats--link"
				>
					<strong>{{ count ? `${count.creators} ` : '- ' }}</strong>
					<span>{{ $t("kara.tagtypes.creators", count?.creators ?? 0) }}</span>
				</nuxt-link>
			</li>
			<li>
				<nuxt-link
					to="/types/langs"
					class="km-home--stats--link"
				>
					<strong>{{ count ? `${count.languages} ` : '- ' }}</strong>
					<span>{{ $t("kara.tagtypes.langs", count?.languages ?? 0) }}</span>
				</nuxt-link>
			</li>
			<li>
				<nuxt-link
					to="/types/authors"
					class="km-home--stats--link"
				>
					<strong>{{ count ? `${count.authors} ` : '- ' }}</strong>
					<span>{{ $t("kara.tagtypes.authors", count?.authors ?? 0) }}</span>
				</nuxt-link>
			</li>
			<li>
				<nuxt-link
					to="/types/songwriters"
					class="km-home--stats--link"
				>
					<strong>{{ count ? `${count.songwriters} ` : '- ' }}</strong>
					<span>{{ $t("kara.tagtypes.songwriters", count?.songwriters ?? 0) }}</span>
				</nuxt-link>
			</li>
			<li>
				<span>{{ $t("stats.media_size") }}</span> :
				<strong>{{ count ? prettyBytes(Number(count.mediasize)) : '-' }}</strong>
			</li>
			<li class="km-home--stats--wide">
				<span>{{ $t("stats.last_generation") }}</span> :
				<strong>{{ lastGeneration ? new Date(lastGeneration).toLocaleString() : '-' }}</strong>
			</li>
			<li class="km-home--stats--wide">
				<span>{{ $t("stats.all_duration") }}</span> :
				<strong>{{ count && count.duration ? getDurationString(count.duration, t) : '-' }}</strong>
			</li>
		</ul>
	</div>
</template>

<script setup lang="ts">
	import type { DBStats } from '%/../src/types/database/kara';
	import type { KaraList as KaraListType } from '%/lib/types/kara';
	import { storeToRefs } from 'pinia';
	import prettyBytes from 'pretty-bytes';
	import slug from 'slug';
	import { useConfigStore } from '~/store/config';
	import { useLocalStorageStore } from '~/store/localStorage';
	import { useMenubarStore } from '~/store/menubar';
	import { useModalStore } from '~/store/modal';

	const token = ref('');
	const error = ref(false);

	const { enabledCollections } = storeToRefs(useLocalStorageStore());
	const { setAutoplay } = useLocalStorageStore();
	const { search } = storeToRefs(useMenubarStore());
	const { reset } = useMenubarStore();
	const { openModal } = useModalStore();
	const { push } = useRouter();
	const { config } = storeToRefs(useConfigStore());
	const requestUrl = useRequestURL();
	const { t } = useI18n();

	useSeoMeta({
		charset: 'utf-8',
		viewport: 'width=device-width, initial-scale=1',
		twitterCard: 'summary',
		twitterSite: '@KaraokeMugen',
		twitterTitle: config?.value?.KaraExplorer.Tagline,
		description: config?.value?.KaraExplorer.Tagline,
		themeColor: '#375a7f',
		ogTitle: requestUrl.hostname,
		ogDescription: config?.value?.KaraExplorer.Tagline,
		ogType: 'website',
		ogImage: 'https://gitlab.com/karaokemugen/main/-/raw/master/Resources/banniere/banner-website-2021b.png',
		author: 'Karaoke Mugen contributors',
	});

	definePageMeta({
		keepalive: {
			include: ['KaraSearch', 'UserView', 'UserSearch'],
			max: 3
		}
	});

	useHead({
		title: t('titles.home') as string
	});

	reset();

	watch(search, () => push('/search'));

	const { data: count } = await useCustomFetchAsync<DBStats>('/api/karas/stats');
	const { data: lastGeneration } = await useCustomFetchAsync<string>('/api/karas/lastUpdate');

	async function joinKara(): Promise<void> {
		if (token.value) {
			error.value = false;
			try {
				let url: string;
				if (/^https?:\/\//.test(token.value)) {
					url = token.value;
				} else {
					url = `${requestUrl.protocol}//${token.value}.${requestUrl.host}`;
				}
				await $fetch(url);
				window.open(url, '_self');
			} catch (e) {
				error.value = true;
			}
		}
	}

	async function openRandomKara() {
		const res = await useCustomFetch<KaraListType>('/api/karas/search', {
			params: {
				random: 1,
				forPlayer: true,
				safeOnly: true,
				collections: enabledCollections.value.join(',')
			}
		});
		const kid = res.content[0].kid;
		const slugTitle = slug(res.content[0].titles[res.content[0].titles_default_language || 'eng']);
		setAutoplay(true);
		push(`/kara/${slugTitle}/${kid}/theater`);
	}
</script>

<style scoped lang="scss">
	.middle-size {
		max-width: 90%;
	}

	@media (min-width: 1024px) {
		.middle-size {
			width: 50%;
		}
	}

	.km-home {
		display: flex;
		flex-direction: column;
		align-items: center;

		.km-home--logo img {
			max-height: 15rem;
		}

		.title {
			cursor: pointer;
		}

		.title:hover > a {
			color: #1dd2af;
		}

		.km-home--stats {
			max-width: 600px;
			padding: 0;
			margin: auto;
			display: flex;
			flex-direction: row;
			flex-wrap: wrap;
			list-style: none;

			.km-home--stats--link {
				cursor: pointer;
				color: unset;
			}

			li {
				padding: 0.5em;
				width: calc(50% - 1em);
				background: #375a7f;
				color: #fff;
				margin: 0.5em;
				border-radius: 0.25em;
			}

			.km-home--stats--wide {
				width: 100%;
			}
		}
	}

	.mobile-search-bar {
		width: 80%;
		margin: 1em 0;
		display: flex;
		flex-direction: column;
		> button {
			margin-bottom: .5em;
		}
	}

	.button-play {
		font-size: 1.5em;
		margin-bottom: 1em;
	}
</style>
