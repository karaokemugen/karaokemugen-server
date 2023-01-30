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
			{{ explorerHost }}
			<nuxt-link href="#">
				<font-awesome-icon
					:icon="['fas', 'folder-plus']"
					:fixed-width="true"
				/>
			</nuxt-link>
		</h1>
		<h2 class="subtitle">
			{{ explorerTagline }}
		</h2>
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
					<strong>{{ count.karas>0 ? count.karas : '-' }}</strong>
					<span>{{ $t("stats.karaokes", count.karas) }}</span>
				</nuxt-link>
			</li>
			<li>
				<nuxt-link
					to="/types/series"
					class="km-home--stats--link"
				>
					<strong>{{ count.series>0 ? count.series : '-' }}</strong>
					<span>{{ $t("kara.tagtypes.series", count.series) }}</span>
				</nuxt-link>
			</li>
			<li>
				<nuxt-link
					to="/types/singers"
					class="km-home--stats--link"
				>
					<strong>{{ count.singers>0 ? count.singers : '-' }}</strong>
					<span>{{ $t("kara.tagtypes.singers", count.singers) }}</span>
				</nuxt-link>
			</li>
			<li>
				<nuxt-link
					to="/types/creators"
					class="km-home--stats--link"
				>
					<strong>{{ count.creators>0 ? count.creators : '-' }}</strong>
					<span>{{ $t("kara.tagtypes.creators", count.creators) }}</span>
				</nuxt-link>
			</li>
			<li>
				<nuxt-link
					to="/types/langs"
					class="km-home--stats--link"
				>
					<strong>{{ count.languages>0 ? count.languages : '-' }}</strong>
					<span>{{ $t("kara.tagtypes.langs", count.languages) }}</span>
				</nuxt-link>
			</li>
			<li>
				<nuxt-link
					to="/types/authors"
					class="km-home--stats--link"
				>
					<strong>{{ count.authors>0 ? count.authors : '-' }}</strong>
					<span>{{ $t("kara.tagtypes.authors", count.authors) }}</span>
				</nuxt-link>
			</li>
			<li>
				<nuxt-link
					to="/types/songwriters"
					class="km-home--stats--link"
				>
					<strong>{{ count.songwriters>0 ? count.songwriters : '-' }}</strong>
					<span>{{ $t("kara.tagtypes.songwriters", count.songwriters) }}</span>
				</nuxt-link>
			</li>
			<li>
				<span>{{ $t("stats.media_size") }}</span> :
				<strong>{{ count.mediasizeString ? count.mediasizeString : '-' }}</strong>
			</li>
			<li class="km-home--stats--wide">
				<span>{{ $t("stats.last_generation") }}</span> :
				<strong>{{ lastGeneration ? new Date(lastGeneration).toLocaleString() : '-' }}</strong>
			</li>
			<li class="km-home--stats--wide">
				<span>{{ $t("stats.all_duration") }} :</span>
				<strong>{{ count.durationString ? count.durationString : '-' }}</strong>
			</li>
		</ul>
	</div>
</template>

<script setup lang="ts">
	import prettyBytes from 'pretty-bytes';
	import duration from '~/assets/date';
	import { useModalStore } from '~/store/modal';
	import { DBStats } from '%/../src/types/database/kara';
	import { useMenubarStore } from '~/store/menubar';

	export interface Stats extends DBStats {
		mediasizeString?: string,
		durationString?: string
	}

	const token = ref('');
	const error = ref(false);
	const lastGeneration = ref<Date | string>('-');
	const count = ref<Stats>({
		singers: 0,
		creators: 0,
		languages: 0,
		authors: 0,
		songwriters: 0,
		series: 0,
		karas: 0,
		duration: 0,
		mediasize: 0
	});

	const conf = useRuntimeConfig();
	const explorerProtocol = conf.public.EXPLORER_PROTOCOL;
	const explorerHost = conf.public.EXPLORER_HOST;
	const explorerTagline = conf.public.EXPLORER_TAGLINE;

	const { reset } = useMenubarStore();
	const { openModal } = useModalStore();

	const { t } = useI18n();

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

	fetch();

	async function fetch() {
		const stats = useCustomFetch<Stats>('/api/karas/stats');
		const lastGen = useCustomFetch<Date>('/api/karas/lastUpdate');
		const res = await Promise.all([stats, lastGen]);
		if (res[0] && res[1]) {
			const countUpdated = res[0];
			if (countUpdated.mediasize) { countUpdated.mediasizeString = prettyBytes(Number(countUpdated.mediasize)); }
			if (countUpdated.duration) {
				const durationArray = duration(countUpdated.duration);
				let returnString = '';
				if (durationArray[0] !== 0) { returnString += `${durationArray[0]} ${t('duration.days')} `; }
				if (durationArray[1] !== 0) { returnString += `${durationArray[1]} ${t('duration.hours')} `; }
				if (durationArray[2] !== 0) { returnString += `${durationArray[2]} ${t('duration.minutes')} `; }
				if (durationArray[3] !== 0) { returnString += `${durationArray[3]} ${t('duration.seconds')} `; }
				countUpdated.durationString = returnString;
			}
			lastGeneration.value = res[1];
			count.value = countUpdated;
		}
	}

	async function joinKara(): Promise<void> {
		if (token.value) {
			error.value = false;
			try {
				let url: string;
				if (/^https?:\/\//.test(token.value)) {
					url = token.value;
				} else {
					url = `${explorerProtocol}://${token.value}.${explorerHost}`;
				}
				await $fetch(url);
				window.open(url, '_self');
			} catch (e) {
				error.value = true;
			}
		}
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
</style>
