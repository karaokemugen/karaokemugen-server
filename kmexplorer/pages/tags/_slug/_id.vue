<template>
	<kara-query v-if="tag.type" :tag="tag" />
</template>

<script lang="ts">
	import Vue from 'vue';

	import KaraQuery from '~/components/KaraQuery.vue';
	import { TagExtend } from '~/store/menubar';
	import { tagRegex, tagTypesMap } from '~/assets/constants';
	import { Tag } from '%/lib/types/tag';
	import { menuBarStore } from '~/store';

	interface VState {
		tag: TagExtend | null
	}

	export default Vue.extend({
		name: 'KaraListTag',

		components: {
			KaraQuery
		},

		async fetch() {
			const tagInfo = tagRegex.exec(this.$route.params.id);
			if (!tagInfo) { throw new Error('Stealth check failed: Tag regex not matched'); }
			const res = await this.$axios.get<Tag>(`/api/tags/${tagInfo[1]}`).catch(
				_err => this.$nuxt.error({ statusCode: 404, message: this.$t('tag.notfound') as string }));
			if (res) {
				this.tag = {
					type: tagTypesMap[parseInt(tagInfo[2])].name as string,
					tag: res.data
				};
				if (!process.server) {
					menuBarStore.setTags([this.tag]);
				}
			}
		},

		data(): VState {
			return {
				tag: { type: '', tag: { name: '', types: [], tid: '' } }
			};
		},

		validate({ params }) {
			return tagRegex.test(params?.id);
		},

		transition: 'fade'
	});
</script>
