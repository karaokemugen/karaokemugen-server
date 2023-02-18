<template>
	<nuxt-link
		:class="[tagTypes[type].class, staticheight ? '':'no-static-height']"
		class="tag is-medium"
		@click.prevent="handleLink"
	>
		<font-awesome-icon
			v-if="icon"
			:icon="['fas', tagTypes[type].icon]"
			:fixed-width="true"
		/>
		<p>{{ localizedName }}</p>
		<span
			v-if="showkaracount"
			class="karacount"
		>&nbsp;({{ tag.karacount && tag.karacount[tagTypes[type].type as number] }})</span>
		<button
			v-if="deletebtn"
			class="delete is-small"
			@click="emit('close')"
		/>
	</nuxt-link>
</template>

<script setup lang="ts">
	import { DBTag } from '%/lib/types/database/tag';
	import { tagTypes } from '~/assets/constants';
	import { useMenubarStore } from '~/store/menubar';

	const { addTag, setSearch } = useMenubarStore();
	const route = useRoute();
	const { push } = useRouter();

	const props = withDefaults(defineProps<{
		tag: DBTag,
		icon?: boolean
		type: string
		i18n?: Record<string, Record<string, string>>
		nolink?: boolean
		staticheight?: boolean
		showkaracount?: boolean
		deletebtn?: boolean
	}>(), {
		icon: false,
		nolink: false,
		staticheight: true,
		deletebtn: false
	});

	const emit = defineEmits<{(e: 'close'): void}>();

	const localizedName= computed((): string => getTagInLocale(props.tag, props.i18n));

	function handleLink() {
		if (!props.nolink && props.type !== 'collections') { // Collections are not clickable
			// If no tags are present, redirect the user to the KaraList view with this tag.
			const payload = { tag: props.tag, type: props.type };
			// Put i18n in tag directly
			if (props.i18n) {
				const tag = { ...props.tag };
				tag.i18n = props.i18n[tag.tid];
				payload.tag = tag;
			}
			addTag(payload);
			if (['kara-slug-id', 'types-id'].includes(route.name as string)) {
				setSearch('');
			}
			if (!['search-query', 'user-login'].includes(route.name as string)) {
				push(generateNavigation());
			}
		}
	}
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
