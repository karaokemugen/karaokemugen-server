<template>
	<div>
		<!-- eslint-disable-next-line vue/no-v-html -->
		<div v-html="result" />
	</div>
</template>

<script setup lang="ts">
	import MarkdownIt from 'markdown-it'

	const md = new MarkdownIt();
	const privacypolicy = await useCustomFetch<string>('/api/privacypolicy');
	const result = md.render(privacypolicy)
</script>