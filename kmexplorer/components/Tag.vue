<template>
	<a
		:href="nolink ? `./#`:(type === 'years' ? `/years/${tag.name}`:`/tags/${slug}/${tag.tid}~${tagTypes[type].type}`)"
		:class="[tagTypes[type].class, staticheight ? '':'no-static-height']"
		class="tag is-medium"
		@click.prevent="handleLink"
	>
		<font-awesome-icon v-if="icon" :icon="['fas', tagTypes[type].icon]" :fixed-width="true" />
		<p>{{ localizedName }}</p>
		<span v-if="showkaracount" class="karacount">&nbsp;({{ tag.karacount[tagTypes[type].type] }})</span>
		<button v-if="deletebtn" class="delete is-small" @click="$emit('close')" />
	</a>
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import slug from 'slug';
	import { tagTypes } from '~/assets/constants';
	import { menuBarStore } from '~/store';
	import { generateNavigation, getTagInLocale } from '~/utils/tools';
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
				type: Boolean,
				default: false
			},
			type: {
				type: String,
				required: true
			},
			i18n: {
				type: Object
			},
			nolink: {
				type: Boolean,
				default: false
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
				return getTagInLocale(this.tag, this.$store.state.auth.user, this.i18n);
			},
			slug(): string {
				return slug(this.tag.name);
			}
		},

		methods: {
			handleLink() {
				if (!this.nolink && this.type !== 'collections') { // Collections are not clickable
					// If no tags are present, redirect the user to the KaraList view with this tag.
					const payload = { tag: this.tag, type: this.type };
					// Put i18n in tag directly
					if (this.i18n) {
						const tag = { ...this.tag };
						tag.i18n = this.i18n;
						payload.tag = tag;
					}
					menuBarStore.addTag(payload);
					if (['kara-slug-id', 'types-id'].includes(this.$route.name as string)) {
						menuBarStore.setSearch('');
					}
					if (!['search-query', 'user-login'].includes(this.$route.name as string)) {
						this.$router.push(generateNavigation(menuBarStore));
					}
				}
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
	.tag p {
		overflow: hidden;
		text-overflow: ellipsis;
	}
</style>
