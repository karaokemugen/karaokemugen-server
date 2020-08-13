<template>
	<nuxt-link
		:to="nolink ? ``:`/tags/${slug}/${tag.tid}~${tagTypes[type].type}`"
		class="tag is-medium"
		:class="[tagTypes[type].class, staticheight ? '':'no-static-height', tag.problematic ? 'problematic':'']"
		no-prefetch
	>
		<font-awesome-icon v-if="icon" :icon="['fas', tagTypes[type].icon]" :fixed-width="true" />
		{{ localizedName }}
		<span v-if="showkaracount" class="karacount">&nbsp;({{ tag.karacount[tagTypes[type].type] }})</span>
		<button v-if="deletebtn" class="delete is-small" @click="$emit('close')" />
	</nuxt-link>
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import slug from 'slug';
	import { tagTypes } from '~/assets/constants';
	import { getSerieLanguage, getTagInLanguage } from '~/utils/tools';
	import { DBTag } from '%/lib/types/database/tag';

	interface VState {
		tagTypes: typeof tagTypes
	}

	export default Vue.extend({
		name: 'Tag',

		props: {
			tag: {
				type: Object,
				required: true
			} as PropOptions<DBTag>,
			icon: {
				type: Boolean
			},
			type: {
				type: String,
				required: true
			},
			i18n: {
				type: Object
			},
			nolink: {
				type: Boolean
			},
			staticheight: {
				type: Boolean,
				default: true
			},
			showkaracount: {
				type: Boolean
			},
			deletebtn: {
				type: Boolean,
				default: false
			}
		},

		data(): VState {
			return {
				tagTypes
			};
		},

		computed: {
			localizedName(): string {
				if (this.type === 'series') {
					return getSerieLanguage(this.tag, 'jpn', this.$store.state.auth.user, this.i18n); // TODO: true value for karaLanguage
				} else {
					return getTagInLanguage(this.tag, this.$i18n.locale, 'eng', this.i18n);
				}
			},
			slug(): string {
				return slug(this.tag.name);
			}
		}
	});
</script>

<style scoped lang="scss">
	.svg-inline--fa {
		margin-right: 0.25rem;
	}
	.tag.no-static-height {
		height: unset;
		white-space: unset;
		padding-top: .25em;
		padding-bottom: .25em;
	}
	.tag.problematic {
		color: gold;
	}
	.karacount {
		font-size: 0.8em;
		opacity: 0.6;
	}
</style>
