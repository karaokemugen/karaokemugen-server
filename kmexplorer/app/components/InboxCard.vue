<template>
	<article class="box tile is-child is-flex is-justify-content-space-between">
		<div class="is-flex is-align-items-start">
			<div class="title mb-0">
				{{ inbox.name }}
				<div v-if="inbox.modified_at" class="subtitle">
					{{ $t('submissions.modified_at', { date : new Date(inbox.modified_at).toLocaleString() }) }}
					<i18n-t v-if="rejectReasonOpen" keypath="submissions.rejected_reason" tag="div">
						<template #reason>
							<span class="has-text-weight-bold">{{ inbox.reject_reason }}</span>
						</template>
					</i18n-t>
				</div>
			</div>
			<div :class="`mt-1 tag ${getClassByStatus()}`">
				{{ $t(`submissions.status.${inbox.status}`) }}
			</div>
			<button v-if="inbox.reject_reason" class="button" @click="rejectReasonOpen = !rejectReasonOpen">
				{{ $t('submissions.rejected_reason_button') }}
			</button>
		</div>
		<div class="is-flex is-justify-content-space-between">
			<div class="buttons">
				<nuxt-link
					v-if="inbox.status !== 'accepted' && inbox.status !== 'rejected'"
					class="button"
					:to="`/import/${inbox.kid}?inid=${inbox.inid}`"
				>
					<font-awesome-icon :icon="['fas', 'pen']" />
					<span>{{ $t('playlists.edit') }}</span>
				</nuxt-link>
				<button v-if="inbox.status === 'sent'" class="button is-danger" @click="deleteInbox">
					<font-awesome-icon :icon="['fas', 'trash']" />
					<span>{{ $t('playlists.delete') }}</span>
				</button>
			</div>
		</div>
	</article>
</template>

<script setup lang="ts">
import type { Inbox } from '%/lib/types/inbox';

const props = defineProps<{
	inbox: Inbox
}>();

const rejectReasonOpen = ref(false);
const emit = defineEmits<{ (e: 'refresh'): void }>();

async function deleteInbox() {
	await useCustomFetch(`/api/inbox/${props.inbox.inid}`, {
		method: 'DELETE',
	});
	emit('refresh');
}

function getClassByStatus(): string {
	switch (props.inbox.status) {
		case 'sent': return 'is-white'
		case 'in_review': return 'is-info'
		case 'changes_requested': return 'isis-warning'
		case 'accepted': return 'is-success'
		case 'rejected': return 'is-danger'
	}
	return '';
}
</script>
<style scoped lang="scss">
.is-repeat {
	color: #1dd2af;
}

@media screen and (max-width: 768px) {
	.is-flex {
		flex-direction: column;
	}
}
</style>
