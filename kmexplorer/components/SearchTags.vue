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

	watch(tags, () => {
		nextTick(() => {
			getNavbarHeight();
		});
	}, { deep: true });

	function getNavbarHeight() {
		if (process.client) {
			const element = document.getElementsByClassName('navbar is-primary is-fixed-top')[0] as HTMLElement;
			document.documentElement.style.setProperty('--maxh', `calc(${element.offsetHeight}px - 4.7rem)`);
		}
	}
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
