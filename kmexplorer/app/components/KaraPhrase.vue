<template>
	<i18n-t
		keypath="kara.phrase"
		:tag="tag"
	>
		<template #songtype>
			<nuxt-link
				:to="handleLink(songtype, false)"
				@click.left.prevent.capture="handleLink(songtype)"
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
						:to="handleLink(version, false)"
						@click.left.prevent.capture="handleLink(version)"
					>{{ version.name }}</nuxt-link>
					<template v-if="index+1 < versions.length">, </template>
				</template>)
			</span>
		</template>
		<template #series>
			<nuxt-link
				:to="handleLink(serieSinger, false)"
				@click.left.prevent.capture="handleLink(serieSinger)"
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

	const serieSinger = computed<ShortTag>(() => getSerieOrSingerGroupsOrSingers(props.karaoke, props.karaokesI18n));

	const songtype = computed<ShortTag>(() => {
		const songtypes = sortAndHideTags(props.karaoke.songtypes);
		return {
			slug: slug(songtypes[0].name),
			name: getTagInLocale(songtypes[0], props.karaokesI18n && props.karaokesI18n[songtypes[0].tid]),
			type: 'songtypes',
			tag: songtypes[0]
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

	function handleLink(tag: ShortTag, pushToLink = true) {
		if (props.karaokesI18n && props.karaokesI18n[tag.tag.tid]) {
			const tagUpdated = { ...tag.tag };
			tagUpdated.i18n = props.karaokesI18n[tag.tag.tid];
			tag.tag = tagUpdated;
		}
		if (pushToLink) {
			addTag({
				type: tag.type,
				tag: tag.tag
			});
			push(generateNavigation());
		} else {
			return generateNavigation('', [{
				type: tag.type,
				tag: tag.tag
			}]);
		}
	}
</script>
