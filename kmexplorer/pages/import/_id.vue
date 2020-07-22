<template>
	<div class="is-ancestor">
		<i18n path="kara.import.description" tag="div" class="description"></i18n>
		<div class="description">
			<i18n path="kara.import.attention" class="attention"></i18n>
			<i18n path="kara.import.check_in_progress"></i18n>
		</div>
		<div class="description">
			<ul>
				<li>
					<a href="http://docs.karaokes.moe">{{$t('kara.import.documentation_link')}}</a>
				</li>
				<li v-if="in_progress_songs_list">
					<a
						:href="in_progress_songs_list"
					>{{$t('kara.import.in_progress_link')}}</a>
				</li>
			</ul>
		</div>
		<article class="message is-info" v-if="base_license_name">
			<div class="message-header">
				<p>{{$t('kara.import.license_reminder', {name: base_license_name})}}</p>
			</div>
			<div class="message-body">
				<a v-if="base_license_link"
				   :href="base_license_link"
				>{{$t('kara.import.license_link')}}</a>
			</div>
		</article>
		<div class="tile is-child is-8">
			<kara-edit :karaparam="karaparam"></kara-edit>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue from "vue";
	import KaraEdit from "~/components/KaraEdit.vue";
	import {DBKara} from "%/lib/types/database/kara";

	interface VState {
		base_license_name?: string,
		base_license_link?: string,
		in_progress_songs_list?: string,
		karaparam: DBKara
	}

	export default Vue.extend({
		name: "ImportKara",

		components: {
			KaraEdit
		},

		data(): VState {
			return {
				base_license_name: process.env.BASE_LICENSE_NAME,
				base_license_link: process.env.BASE_LICENSE_LINK,
				in_progress_songs_list: process.env.IN_PROGRESS_SONGS_LIST,
				karaparam: {} as unknown as DBKara
			}
		},

		validate() {
			return (process.env.KM_IMPORT as unknown as boolean);
		},

		async asyncData({params, $axios, error, app}) {
			if (params.id) {
				let result = await $axios
					.get(`/api/karas/${params.id}`)
					.catch(_err =>
						error({statusCode: 404, message: app.i18n.t("kara.notfound") as string})
					);
				if (result) {
					return {karaparam: result.data};
				} else {
					error({statusCode: 500, message: 'Huh?'});
				}
			} else {
				return {
					karaparam: {
						series: [],
						singers: [],
						misc: [],
						groups: [],
						songwriters: [],
						creators: [],
						authors: [],
						langs: [],
						songtypes: [],
						families: [],
						genres: [],
						platforms: [],
						origins: [],
						modified_at: new Date(),
						created_at: new Date()
					}
				};
			}
		}
	});
</script>

<style scoped lang="scss">
	.description {
		margin: 1em;
		font-size: medium;

		.attention {
			font-weight: bolder;
		}
	}

	.tile .is-child {
		transition: width 0.8s;
		max-width: 1000px;
	}

	.is-info {
		max-width: 50em;
	}
</style>
