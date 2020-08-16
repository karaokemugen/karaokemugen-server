<template>
	<div v-if="tags.length > 0">
		<tag
			v-for="(tag, key) in tags"
			:key="key"
			:tag="tag.tag"
			:type="tag.type"
			icon
			nolink
			deletebtn
			@close="tagRemover(tag)"
		/>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import { mapState } from 'vuex';
	import Tag from '~/components/Tag.vue';
	import { menuBarStore } from '~/store';
	import { TagExtend } from '~/store/menubar';

	export default Vue.extend({
		name: 'SearchTags',

		components: {
			Tag
		},

		computed: {
			...mapState('menubar', ['tags'])
		},

		methods: {
			tagRemover(tag: TagExtend) {
				menuBarStore.removeTag(tag);
			}
		}

	});
</script>

<style scoped lang="scss">
	.navbar-item.is-desktop {
		max-width: 35em;
		flex-shrink: 1;
		flex-wrap: wrap;
	}
</style>
