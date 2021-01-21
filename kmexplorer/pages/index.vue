<template>
	<div class="km-home">
		<a href="http://karaokes.moe/">
			<picture class="km-home--logo">
				<source type="image/webp" :srcset="require('~/assets/km-logo.webp')">
				<source type="image/png" :srcset="require('~/assets/km-logo.png')">
				<img :src="require('~/assets/km-logo.png')" alt="Logo">
			</picture>
		</a>
		<h1 class="title" :title="$t('modal.add_repository.label')" @click.prevent="openAddRepoModal">
			{{ $t('modal.add_repository.button') }}
			{{ explorerHost }}
			<a href="#">
				<font-awesome-icon :icon="['fas', 'folder-plus']" :fixed-width="true" />
			</a>
		</h1>
		<h2 class="subtitle">
			{{ explorerTagline }}
		</h2>
		<div class="mobile-search-bar is-hidden-desktop">
			<search-bar :filter="false" :results="false" icon />
		</div>
		<article v-if="noInstance" class="message is-warning middle-size">
			<div class="message-header">
				<p>
					{{ $t('home.noInstance.title') }}
				</p>
				<button class="delete" aria-label="delete" @click="noInstance = false" />
			</div>
			<div class="message-body">
				{{ $t('home.noInstance.1') }}
				<br>{{ $t('home.noInstance.2') }}
				<br>{{ $t('home.noInstance.3') }}
			</div>
		</article>
		<ul class="km-home--stats">
			<li>
				<nuxt-link to="/search" class="km-home--stats--link">
					<strong>{{ count.karas>0 ? count.karas : '-' }}</strong>
					<span>{{ $tc("stats.karaokes", count.karas) }}</span>
				</nuxt-link>
			</li>
			<li>
				<nuxt-link to="/types/series" class="km-home--stats--link">
					<strong>{{ count.series>0 ? count.series : '-' }}</strong>
					<span>{{ $tc("kara.tagtypes.series", count.series) }}</span>
				</nuxt-link>
			</li>
			<li>
				<nuxt-link to="/types/singers" class="km-home--stats--link">
					<strong>{{ count.singers>0 ? count.singers : '-' }}</strong>
					<span>{{ $tc("kara.tagtypes.singers", count.singers) }}</span>
				</nuxt-link>
			</li>
			<li>
				<nuxt-link to="/types/creators" class="km-home--stats--link">
					<strong>{{ count.creators>0 ? count.creators : '-' }}</strong>
					<span>{{ $tc("kara.tagtypes.creators", count.creators) }}</span>
				</nuxt-link>
			</li>
			<li>
				<nuxt-link to="/types/langs" class="km-home--stats--link">
					<strong>{{ count.languages>0 ? count.languages : '-' }}</strong>
					<span>{{ $tc("kara.tagtypes.langs", count.languages) }}</span>
				</nuxt-link>
			</li>
			<li>
				<nuxt-link to="/types/authors" class="km-home--stats--link">
					<strong>{{ count.authors>0 ? count.authors : '-' }}</strong>
					<span>{{ $tc("kara.tagtypes.authors", count.authors) }}</span>
				</nuxt-link>
			</li>
			<li>
				<nuxt-link to="/types/songwriters" class="km-home--stats--link">
					<strong>{{ count.songwriters>0 ? count.songwriters : '-' }}</strong>
					<span>{{ $tc("kara.tagtypes.songwriters", count.songwriters) }}</span>
				</nuxt-link>
			</li>
			<li>
				<span>{{ $t("stats.media_size") }}</span> :
				<strong>{{ count.mediasize !== 0 ? count.mediasize : '-' }}</strong>
			</li>
			<li class="km-home--stats--wide">
				<span>{{ $t("stats.last_generation") }}</span> :
				<strong>{{ count.lastGeneration ? new Date(count.lastGeneration).toLocaleString() : '-' }}</strong>
			</li>
			<li class="km-home--stats--wide">
				<span>{{ $t("stats.all_duration") }} :</span>
				<strong>{{ count.duration ? count.duration : '-' }}</strong>
			</li>
		</ul>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import prettyBytes from 'pretty-bytes';
	import duration from '~/assets/date';
	import { modalStore } from '~/store';
	import SearchBar from '~/components/SearchBar.vue';

	export default Vue.extend({
		name: 'HomeStats',

		components: {
			SearchBar
		},

		data() {
			return {
				explorerHost: process.env.EXPLORER_HOST,
				explorerTagline: process.env.EXPLORER_TAGLINE,
				count: {
					singers: 0,
					creators: 0,
					languages: 0,
					authors: 0,
					songwriters: 0,
					series: 0,
					karas: 0,
					duration: 0,
					mediasize: 0
				},
				noInstance: false
			};
		},

		async fetch() {
			const stats = this.$axios.get('/api/karas/stats');
			const lastGen = this.$axios.get('/api/karas/lastUpdate');
			const res = await Promise.all([stats, lastGen]);
			if (res[0] && res[1]) {
				const count = res[0].data;
				if (count.mediasize) { count.mediasize = prettyBytes(Number(count.mediasize)); }
				if (count.mediasize) {
					const durationArray = duration(count.duration);
					let returnString = '';
					if (durationArray[0] !== 0) { returnString += `${durationArray[0]} ${this.$t('duration.days')} `; }
					if (durationArray[1] !== 0) { returnString += `${durationArray[1]} ${this.$t('duration.hours')} `; }
					if (durationArray[2] !== 0) { returnString += `${durationArray[2]} ${this.$t('duration.minutes')} `; }
					if (durationArray[3] !== 0) { returnString += `${durationArray[3]} ${this.$t('duration.seconds')} `; }
					count.duration = returnString;
				}
				count.lastGeneration = res[1].data;
				this.count = count;
			}
		},
		head() {
			return {
				title: this.$t('titles.home') as string
			};
		},
		mounted() {
			if (this.$route.query.noinstance) {
				this.noInstance = true;
			}
		},
		methods: {
			openAddRepoModal() {
				modalStore.openModal('addRepo');
			}
		}
	});
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
	}
</style>
