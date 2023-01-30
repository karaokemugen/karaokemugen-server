<template>
	<div class="box">
		<article class="media">
			<div class="media-content">
				<h4 class="title is-4 content">
					{{ kara.song }}
				</h4>
			</div>
			<div class="media-left">
				<tag
					v-if="kara.language"
					type="langs"
					:tag="{name : getLanguagesFromCode(kara.language)}"
					:staticheight="false"
					icon
					:nolink="true"
				/>
				<tag
					v-if="kara.source && canSeeSource"
					type="groups"
					:tag="{name : kara.source}"
					:staticheight="false"
					icon
					:nolink="true"
				/>
			</div>
			<div class="media-right">
				<button
					v-if="canDelete"
					class="button is-danger"
					:disabled="done_delete"
					:class="{'is-loading': loading}"
					@click="deleteLike"
				>
					{{ $t('suggestions.kara.remove') }}
				</button>
				<button
					class="button is-success"
					:disabled="done_vote"
					:class="{'is-loading': loading}"
					@click="addLike()"
				>
					{{ done_vote ? $t('suggestions.kara.ok'):$t('suggestions.kara.yes') }} ({{ likes }})
				</button>
			</div>
		</article>
	</div>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import { useLocalStorageStore } from '~/store/localStorage';
	import { useAuthStore } from '~/store/auth';
	import { Suggestion } from '~/../kmserver-core/src/types/suggestions';

	const props = defineProps<{
		kara: Suggestion
	}>();

	const loading = ref(false);
	const done_delete = ref(false);
	const done_vote = ref(false);
	const likes = ref(props.kara.likes || 0);

	const { loggedIn, user } = storeToRefs(useAuthStore());
	const { karas } = storeToRefs(useLocalStorageStore());
	const { addKara } = useLocalStorageStore();
	const { locale } = useI18n();

	const canDelete = computed(() => loggedIn.value && !!user?.value?.roles?.admin);
	const canSeeSource = computed(() => loggedIn.value && (!!user?.value?.roles?.admin || !!user?.value?.roles?.maintainer));

	onMounted( () => {
		if (karas.value.find(el => el === props.kara.id) !== undefined) {
			done_vote.value = true;
		}
	});

	async function addLike() {
		loading.value = true;
		await useCustomFetch(`/api/suggestions/${props.kara.id}`, {
			method: 'POST'
		});
		if (props.kara.id) addKara(props.kara.id);
		loading.value = false;
		done_vote.value = true;
		likes.value++;
	}
	async function deleteLike() {
		loading.value = true;
		await useCustomFetch(`/api/suggestions/${props.kara.id}`, {
			method: 'DELETE'
		});
		loading.value = false;
		done_delete.value = true;
	}
	function getLanguagesFromCode(code:string) {
		return getLanguagesInLocaleFromCode(code, (loggedIn.value && user?.value?.language) || locale.value);
	}
</script>

<style lang="scss">

article.media {
	align-items: center;
}

@media screen and (max-width: 700px) {
	article.media {
		flex-direction: column;
	}
}

div.media-content {
    margin: auto 0;
}

h4.title {
    overflow: hidden;
}

@media (max-width: 540px) {
    div.media-right {
        flex-shrink: unset;
    }
    div.button {
        justify-content: right;
    }
}
</style>
