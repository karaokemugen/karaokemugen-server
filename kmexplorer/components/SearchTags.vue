<template>
	<div>
		<tag
			v-for="(tag, key) in tags"
			:key="key"
			:tag="tag.tag"
			:type="tag.type"
			icon
			nolink
			deletebtn
			@close="removeTag(tag)"
		/>
	</div>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import { useMenubarStore } from '~/store/menubar';

	const { removeTag } = useMenubarStore();
	const { tags } = storeToRefs(useMenubarStore());
</script>

<style scoped lang="scss">
	.navbar-item.is-desktop {
		max-width: 35em;
		flex-shrink: 1;
		flex-wrap: wrap;
	}
	.tag {
		margin: 0.1em;
		max-width: 100%;
	}
</style>
