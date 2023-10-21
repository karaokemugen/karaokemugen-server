<template>
	<i18n-t
		keypath="kara.phrase"
		:tag="tag"
	>
		<template #songtype>
			<nuxt-link
				@click.prevent="handleLink(songtype)"
			>
				{{ songtype.name }}<template v-if="karaoke.songorder">
					{{ " " + karaoke.songorder }}
				</template>
			</nuxt-link>
			<span v-if="versions.length > 0">
				(<template
					v-for="(version, index) in versions"
					:key="version.tag.tid"
				>
					<nuxt-link
						@click.prevent="handleLink(version)"
					>{{ version.name }}</nuxt-link>
					<template v-if="index+1 < versions.length">, </template>
				</template>)
			</span>
		</template>
		<template #series>
			<nuxt-link
				@click.prevent="handleLink(serieSinger)"
			>
				{{ serieSinger.name }}
			</nuxt-link>
		</template>
	</i18n-t>
</template>

<script setup lang="ts">
	import slug from 'slug';
	import type { ShortTag } from '~/types/tags';
	import type { DBKara } from '%/lib/types/database/kara';
	import { useMenubarStore } from '~/store/menubar';

	const props = defineProps<{
		tag: string
		karaoke: DBKara
		karaokesI18n?: Record<string, Record<string, string>>
	}>();

	const { push } = useRouter();
	const { addTag } = useMenubarStore();

	const serieSinger = computed<ShortTag>(() => {
		if (props.karaoke.series[0]) {
			return {
				name: getTagInLocale(props.karaoke.series[0], props.karaokesI18n && props.karaokesI18n[props.karaoke.series[0].tid]),
				slug: slug(props.karaoke.series[0].name),
				type: 'series',
				tag: props.karaoke.series[0]
			};
		} else if (props.karaoke.singergroups[0]) {
			return {
				name: getTagInLocale(props.karaoke.singergroups[0], props.karaokesI18n && props.karaokesI18n[props.karaoke.singergroups[0].tid]),
				slug: slug(props.karaoke.singergroups[0].name),
				type: 'singergroups',
				tag: props.karaoke.singergroups[0]
			};
		} else if (props.karaoke.singers[0]) {
			return {
				name: getTagInLocale(props.karaoke.singers[0], props.karaokesI18n && props.karaokesI18n[props.karaoke.singers[0].tid]),
				slug: slug(props.karaoke.singers[0].name),
				type: 'singers',
				tag: props.karaoke.singers[0]
			};
		} else { // You never know~
			throw new TypeError('The karaoke does not have any series nor singers, wtf?');
		}
	});
	const songtype = computed<ShortTag>(() => {
		return {
			slug: slug(props.karaoke.songtypes[0].name),
			name: getTagInLocale(props.karaoke.songtypes[0], props.karaokesI18n && props.karaokesI18n[props.karaoke.songtypes[0].tid]),
			type: 'songtypes',
			tag: props.karaoke.songtypes[0]
		};
	});
	const versions = computed<ShortTag[]>(() => {
		const tab = [];
		for (const version of props.karaoke.versions) {
			tab.push({
				name: getTagInLocale(version, props.karaokesI18n && props.karaokesI18n[version.tid]),
				slug: slug(version.name),
				type: 'versions',
				tag: version
			});
		}
		return tab;
	});

	function handleLink(tag: ShortTag) {
		if (props.karaokesI18n && props.karaokesI18n[tag.tag.tid]) {
			const tagUpdated = { ...tag.tag };
			tagUpdated.i18n = props.karaokesI18n[tag.tag.tid];
			tag.tag = tagUpdated;
		}
		addTag({
			type: tag.type,
			tag: tag.tag
		});
		push(generateNavigation());
	}
</script>
