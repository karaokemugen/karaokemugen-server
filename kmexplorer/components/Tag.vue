<template>
	<nuxt-link
		:to="nolink ? ``:`/tags/${slug}/${tag.tid}~${tagTypes[type].type}`"
		class="tag is-medium"
		:class="[tagTypes[type].class, staticheight ? '':'no-static-height']"
		no-prefetch
	>
		<font-awesome-icon v-if="icon" :icon="['fas', tagTypes[type].icon]" :fixed-width="true" />
		{{ localizedName }}
		<template v-if="showkaracount">
			<span class="karacount">&nbsp;({{ tag.karacount[tagTypes[type].type] }})</span>
		</template>
		<button v-if="deletebtn" class="delete is-small" @click="$emit('close')" />
	</nuxt-link>
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import slug from 'slug';
	import { tagTypes } from '~/assets/constants';
	import { getTagInLanguage } from '~/utils/tools';
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
				return getTagInLanguage(this.tag, this.$i18n.locale, 'eng', this.i18n);
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
	.karacount {
		font-size: 0.8em;
		opacity: 0.6;
	}
</style>
