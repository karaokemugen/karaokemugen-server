<template>
	<loading-nanami v-if="loading" class="tile is-parent is-12" />
	<div v-else>
		<div class="title-box">
			<h1 class="title with-button">
				<font-awesome-icon :icon="['fas', 'file-lines']" :fixed-width="true" />
				{{ $t('profile.submissions') }}
			</h1>
		</div>
		<p v-if="config?.Frontend.Import.CleanupDays" class="has-text-justified is-size-5">
			{{ $t('submissions.cleanup', { days: config.Frontend.Import.CleanupDays }) }}
		</p>
		<div>
			<p
				v-if="config?.Frontend.DiscordURL ||
				config?.Frontend.ForumURL || config?.Frontend.AdminEmail"
				class="has-text-justified mt-1">
				{{ $t('submissions.contact_maintainers') }}
			</p>
			<ul>
				<li>
					<nuxt-link v-if="config?.Frontend.DiscordURL" :href="config?.Frontend.DiscordURL">
						<font-awesome-icon :icon="['fab', 'discord']" :fixed-width="true" />
						{{ $t('submissions.discord') }}
					</nuxt-link>
				</li>
				<li>
					<nuxt-link v-if="config?.Frontend.ForumURL" :href="config?.Frontend.ForumURL">
						<font-awesome-icon :icon="['fab', 'discourse']" :fixed-width="true" />
						{{ $t('submissions.forum') }}
					</nuxt-link>
				</li>
				<li>
					<nuxt-link v-if="config?.Frontend.AdminEmail" :href="`mailto:${config?.Frontend.AdminEmail}`">
						<font-awesome-icon :icon="['fa', 'at']" :fixed-width="true" />
						{{ $t('submissions.email') }}
					</nuxt-link>
				</li>
			</ul>
		</div>
		<p
			v-if="config?.Frontend.Import.LoginNeeded && config?.Frontend.Import.ContributorTrustLevels &&
			user?.contributor_trust_level" class="has-text-justified">
			{{ $t('submissions.quota', {
				songs: (config.Frontend.Import.ContributorTrustLevels[user.contributor_trust_level] || 0) -
					inboxList.length,
				quota: config.Frontend.Import.ContributorTrustLevels[user.contributor_trust_level]
			}) }}
		</p>
		<div v-for="inbox in inboxListToDisplay" :key="inbox.inid" class="tile is-parent">
			<inbox-card :inbox="inbox" @refresh="() => fetch(false)" />
		</div>
	</div>
</template>

<script setup lang="ts">

import type { Inbox } from '%/lib/types/inbox';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '~/store/auth';
import { useConfigStore } from '~/store/config';
import { useMenubarStore } from '~/store/menubar';

const { user } = storeToRefs(useAuthStore());
const { config } = storeToRefs(useConfigStore());
const { sort, search } = storeToRefs(useMenubarStore());
const route = useRoute();

const inboxList = ref<Inbox[]>([]);
const inboxListToDisplay = ref<Inbox[]>([]);
const loading = ref(true);

watch(search, () => inboxListToDisplay.value = inboxList.value
	.filter(inbox => inbox.name.toLowerCase().includes(search.value.toLowerCase())));
watch(sort, () => inboxListToDisplay.value.sort(sortInbox), { deep: true });

async function fetch(withLoading = true) {
	if (!config?.value?.Users?.Enabled || !user?.value) {
		throw createError({ statusCode: 404 });
	}

	if (withLoading) loading.value = true;

	inboxList.value = await useCustomFetch<Inbox[]>('/api/inbox', {
		params: {
			byUser: user?.value?.login
		}
	});
	inboxListToDisplay.value = inboxList.value.sort(sortInbox);
	if (withLoading) loading.value = false;
}

function sortInbox(inbox1: Inbox, inbox2: Inbox) {
	switch (sort.value[route.name as string]) {
		case 'status': return (inbox1.status || '').localeCompare(inbox2.status || '')
		case 'az': return inbox1.name?.localeCompare(inbox2.name)
		default: return new Date(inbox1.modified_at || '').getTime() - new Date(inbox2.modified_at || '').getTime();
	}
}

fetch();

</script>

<style scoped lang="scss">
.title-box {
	display: flex;
	justify-content: flex-start;
	align-items: center;

	@media screen and (max-width: 769px) {
		flex-direction: column;
		align-items: flex-start;
	}
}

.title.with-button {
	padding: 1rem .5rem;
	margin-bottom: .5rem;
}
</style>
