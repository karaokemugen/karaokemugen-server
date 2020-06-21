<template>
	<div class="km-home">
		<a href="http://karaokes.moe/">
			<img class="km-home--logo" :src="require('../assets/km-logo.png')" />
		</a>
		<h1 class="title">{{ explorerHost }}</h1>
		<h2 class="subtitle">Explore! Find! Sing!</h2>
		<ul class="km-home--stats">
			<li key="karas">
				<div class="km-home--stats--link">
					<strong>{{count.karas>0 ? count.karas : '-'}}</strong>
					<span>{{$tc("stats.karaokes", count.karas)}}</span>
				</div>
			</li>
			<li key="serie">
				<div class="km-home--stats--link">
					<strong>{{count.series>0 ? count.series : '-'}}</strong>
					<span>{{$tc("kara.tagtypes.series", count.series)}}</span>
				</div>
			</li>
			<li key="singer">
				<div class="km-home--stats--link">
					<strong>{{count.singers>0 ? count.singers : '-'}}</strong>
					<span>{{$tc("kara.tagtypes.singers", count.singers)}}</span>
				</div>
			</li>
			<li key="creator">
				<div class="km-home--stats--link">
					<strong>{{count.creators>0 ? count.creators : '-'}}</strong>
					<span>{{$tc("kara.tagtypes.creators", count.creators)}}</span>
				</div>
			</li>
			<li key="language">
				<div class="km-home--stats--link">
					<strong>{{count.languages>0 ? count.languages : '-'}}</strong>
					<span>{{$tc("kara.tagtypes.langs", count.languages)}}</span>
				</div>
			</li>
			<li key="author">
				<div class="km-home--stats--link">
					<strong>{{count.authors>0 ? count.authors : '-'}}</strong>
					<span>{{$tc("kara.tagtypes.authors", count.authors)}}</span>
				</div>
			</li>
			<li key="songwriter">
				<div class="km-home--stats--link">
					<strong>{{count.songwriters>0 ? count.songwriters : '-'}}</strong>
					<span>{{$tc("kara.tagtypes.songwriters", count.songwriters)}}</span>
				</div>
			</li>
			<li key="mediasize">
				<span>{{$t("stats.media_size")}}</span> :
				<strong>{{count.mediasize !== 0 ? count.mediasize : '-'}}</strong>
			</li>
			<li class="km-home--stats--wide" key="lastGeneration">
				<span>{{$t("stats.last_generation")}}</span> :
				<strong>{{count.lastGeneration ? new Date(count.lastGeneration).toLocaleString() : '-'}}</strong>
			</li>
			<li class="km-home--stats--wide" key="duration">
				<span>{{$t("stats.all_duration")}} :</span>
				<strong>{{count.duration ? count.duration : '-'}}</strong>
			</li>
		</ul>
	</div>
</template>

<script lang="ts">
import Vue from "vue";
import prettyBytes from 'pretty-bytes';
import duration from '../assets/date';

export default Vue.extend({

	data() {
		return {
			explorerHost: process.env.EXPLORER_HOST,
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
			}
		};
	},
	async asyncData({ params, $axios, error, app }) {
		let result = await $axios.get("/api/karas/stats");
		let count = result.data;
		if (count.mediasize) count.mediasize = prettyBytes(Number(count.mediasize));
		if (count.mediasize) {
			const durationArray = duration(count.duration);
			let returnString = '';
			if (durationArray[0] !== 0) returnString += `${durationArray[0]} ${app.i18n.t("duration.days")} `;
			if (durationArray[1] !== 0) returnString += `${durationArray[1]} ${app.i18n.t("duration.hours")} `;
			if (durationArray[2] !== 0) returnString += `${durationArray[2]} ${app.i18n.t("duration.minutes")} `;
			if (durationArray[3] !== 0) returnString += `${durationArray[3]} ${app.i18n.t("duration.seconds")} `;
			count.duration = returnString;
		}
		count.lastGeneration = (await $axios.get("/api/karas/lastUpdate")).data;
		return { count: count };
	},
	head() {
		return {
			title: this.$t('titles.home')
		}
	}
});
</script>
<style scoped lang="scss">
.km-home {
	display: flex;
	flex-direction: column;
	align-items: center;

	.km-home--logo {
		max-width: 600px;
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
		}
		li {
			padding: 0.5em;
			width: calc(50% - 1em);
			background: #26aacc;
			color: #fff;
			margin: 0.5em;
			border-radius: 0.25em;
		}
		.km-home--stats--wide {
			width: 100%;
		}
	}
}
</style>