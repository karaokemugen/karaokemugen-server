<template>
	<div>
		<div
			v-for="(language, key) in enabledLanguages"
			:key="key"
			class="tag is-medium"
		>
			<p>{{ getLanguagesFromCode(language) }}</p>
			<button
				class="delete is-small"
				@click="() => removeLanguage(language)"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import { useAuthStore } from '~/store/auth';
	import { useMenubarStore } from '~/store/menubar';

	const { locale } = useI18n();

	const { loggedIn, user } = storeToRefs(useAuthStore());
	const { removeLanguage } = useMenubarStore();
	const { enabledLanguages } = storeToRefs(useMenubarStore());

	watch(enabledLanguages, () => {
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

	function getLanguagesFromCode(code:string) {
		return getLanguagesInLocaleFromCode(code, (loggedIn.value && user?.value?.language) || locale.value);
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
