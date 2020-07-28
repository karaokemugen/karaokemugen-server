<template>
	<nuxt-link
		:to="nolink ? ``:`/tags/${slug}/${tag.tid}~${tagTypes[type].type}`"
		class="tag is-medium"
		:class="tagTypes[type].class"
	>
		<font-awesome-icon v-if="icon" :icon="['fas', tagTypes[type].icon]" :fixed-width="true" />
		{{ localizedName }}
		<template v-if="showkaracount">
			&nbsp;({{ tag.karacount[tagTypes[type].type] }})
		</template>
	</nuxt-link>
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import slug from 'slug';
	import { tagTypes } from '~/assets/constants';
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
			showkaracount: {
				type: Boolean
			}
		},

		data(): VState {
			return {
				tagTypes
			};
		},

		computed: {
			localizedName(): string {
				if (this.i18n) {
					return this.i18n[this.$i18n.locale] || this.i18n.eng || this.tag.name;
				} else {
					/* Name resolving strategy
					return this.tag.i18n?.hasOwnProperty(this.$i18n.locale) ? // If i18n exists in user language
						this.tag.i18n[this.$i18n.locale]: // Display this
						this.tag.i18n?.hasOwnProperty('eng') ? this.tag.i18n.eng // Else, fallback on English or worst!
							:this.tag.name; // The tag raw name
					// Why not this.tag.i18n[this.$i18n.locale]? Because we cannot do speculative access (?.) before []
					// It returns an error if this.tag.i18n is undefined
					*/
					if (this.tag.i18n) {
						return this.tag.i18n[this.$i18n.locale] || this.tag.i18n.eng || this.tag.name;
					} else {
						return this.tag.name;
					}
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
</style>
