<template>
	<div>
		<div v-if="user?.roles?.admin">
			<div v-if="state?.version?.tag" class="mb-3">
				<div>{{ $t('dashboard.version.tag', { tag: state.version.tag }) }}</div>
				<div>{{ $t('dashboard.version.date', { date: state.version.date }) }}</div>
				<div>{{ $t('dashboard.version.commit', { commit: state.version.sha }) }}</div>
			</div>
			<div class="mb-3">
				<div>{{ $t('dashboard.repository.latest_commit', { commit: repository?.LatestCommit }) }}</div>
				<div>{{ $t('dashboard.repository.latest_origin_commit', { commit: repository?.LatestOriginCommit }) }}
				</div>
				<div v-if="generation_in_progress" class="mt-2 has-text-warning has-text-weight-bold  is-size-5 ">
					<FontAwesomeIcon class="icon has-text-warning" :icon="['fas', 'triangle-exclamation']" />
					{{ $t('dashboard.repository.generation_in_progress') }}
				</div>
				<div>{{ $t('dashboard.repository.last_generation_date', {
					date: last_generation ? new
						Date(last_generation).toLocaleString() : '-'
				}) }}</div>
			</div>
			<div class="mb-3">
				<div>{{ $t('dashboard.repository.hardsubs.queue_length', { length: hardsub_queue_length }) }}</div>
				<div v-if="current_hardsub_process">{{ $t('dashboard.repository.hardsubs.queue', {
					kid:
						current_hardsub_process, date: current_hardsub_process_start_date
				}) }}</div>
			</div>
			<div class="is-flex">
				<button class="button" @click="updateGit">
					<font-awesome-icon fixed-width :icon="['fab', 'git-alt']" />
					{{ $t('dashboard.update_git') }}
				</button>
				<button class="button has-background-info" @click="generate">
					<font-awesome-icon fixed-width :icon="['fas', 'database']" />
					{{ $t('dashboard.generate_database') }}
				</button>
				<button class="button" @click="generatePreviews">
					<font-awesome-icon fixed-width :icon="['fas', 'images']" />
					{{ $t('dashboard.generate_previews') }}
				</button>
				<button v-if="config?.Hardsub.Enabled" class="button" @click="generateHardsubs">
					<font-awesome-icon fixed-width :icon="['fas', 'file-video']" />
					{{ $t('dashboard.generate_hardsubs') }}
				</button>
			</div>
		</div>
		<div v-if="config?.Frontend.Import.LoginNeeded && config?.Frontend.Import.ContributorTrustLevels" class="mt-5">
			<div class="title-box">
				<h1 class="title">
					{{ $t('dashboard.trust_levels') }}
				</h1>
			</div>
			<p>{{ $t('dashboard.available_trust_levels') }}</p>
			<div v-for="(value, key) in config?.Frontend.Import.ContributorTrustLevels" :key="key">
				{{ $t('dashboard.trust_level_submissions', {
					level: key,
					songs: value
				}) }}
			</div>
			<p>{{ $t('dashboard.submissions_status') }}</p>
			<div class="is-flex is-flex-direction-column mt-5">
				<div v-for="contributor in contributors" :key="contributor.login" class="tile">
					<div class="box is-flex is-justify-content-space-between">
						<nuxt-link :to="`/user/${contributor.login}`">
							{{ contributor.nickname }}
						</nuxt-link>
						<select @change="(event) => updateContributorLevel(event, contributor)">
							<option
								v-for="key in Object.keys(config?.Frontend.Import.ContributorTrustLevels)"
								:key="key"
								:value="key"
								:selected="Number(key) === contributor.contributor_trust_level" 
							>
								{{ $t('dashboard.trust_level', { level: key }) }}
							</option>
						</select>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { DBUser } from '%/lib/types/database/user';
import type { State } from '%/types/state';
import type { UserList } from '%/types/user';
import { io } from 'socket.io-client';
import * as Toast from 'vue-toastification';
import { useAuthStore } from '~/store/auth';
import { useConfigStore } from '~/store/config';

// @ts-expect-error vue-toastification is not typed
const useToast = Toast.useToast ?? Toast.default.useToast;
const { user } = storeToRefs(useAuthStore());
const { origin } = useRequestURL();
let socket;
if (origin.includes('localhost')) {
	socket = io('localhost:1350');
} else {
	socket = io(origin);
}
const { t } = useI18n();
const toast = useToast();
const { config } = storeToRefs(useConfigStore());

const contributors = ref<DBUser[]>([]);
const state = ref<State>();
const repository = ref<{ LatestCommit: string, LatestOriginCommit: string }>();
const generation_in_progress = ref(false);
const last_generation = ref<string>()
const hardsub_queue_length = ref(0);
const current_hardsub_process = ref<string>();
const current_hardsub_process_start_date = ref<string>();

if (import.meta.client && !user?.value?.roles?.admin && !user?.value?.roles?.maintainer) throw createError({ statusCode: 404 });

if (import.meta.client && user?.value?.roles?.admin) {
	onMounted(() => {
		socket.on("tasksUpdated", (tasks: [{ text: string }]) => {
			if (!generation_in_progress.value && tasks.some(v => v.text === 'GENERATING')) generation_in_progress.value = true;
		});
		socket.on("statsRefresh", () => {
			generation_in_progress.value = false;
			getLastGeneration();
		});
		socket.on("hardsubQueueLengthUpdated", (queueLength: number) => {
			hardsub_queue_length.value = queueLength;
		});
		socket.on("hardsubQueueUpdated", (queue: string[]) => {
			if (queue.length > 0) {
				current_hardsub_process.value = queue[0];
				current_hardsub_process_start_date.value = new Date().toLocaleString();
			} else {
				current_hardsub_process.value = undefined;
				current_hardsub_process_start_date.value = undefined;
			}
		});
	});

	onUnmounted(() => {
		socket.off("tasksUpdated", (tasks: [{ text: string }]) => {
			if (!generation_in_progress.value && tasks.some(v => v.text === 'GENERATING')) generation_in_progress.value = true;
		});
		socket.off("statsRefresh", () => {
			generation_in_progress.value = false;
			getLastGeneration();
		});
		socket.off("hardsubQueueLengthUpdated", (queueLength: number) => {
			hardsub_queue_length.value = queueLength;
		});
		socket.off("hardsubQueueUpdated", (queue: string[]) => {
			if (queue.length > 0) {
				current_hardsub_process.value = queue[0];
				current_hardsub_process_start_date.value = new Date().toLocaleString();
			} else {
				current_hardsub_process.value = undefined;
				current_hardsub_process_start_date.value = undefined;
			}
		});
	});
}

async function updateGit() {
	await useCustomFetch('/api/git/update', { method: 'POST' });
	toast.success(t('dashboard.update_git_triggered'));
}

async function generate() {
	await useCustomFetch('/api/generate', { method: 'POST' });
	toast.success(t('dashboard.generation_triggered'));
}

async function generatePreviews() {
	await useCustomFetch('/api/previews/generate', { method: 'POST' });
	toast.success(t('dashboard.generation_triggered'));
}

async function generateHardsubs() {
	await useCustomFetch('/api/hardsubs/generate', { method: 'POST' });
	toast.success(t('dashboard.generation_triggered'));
}

async function getContributors() {
	contributors.value = (await useCustomFetch<UserList>('/api/users', {
		query: {
			roles: '+contributor,-maintainer,-admin'
		}
	})).content;
}

async function updateContributorLevel(event: Event, contributor: DBUser) {
	await useCustomFetch(`/api/users/${contributor.login}/contributortrustlevel`, {
		method: 'PUT',
		body: {
			level: (event.target as HTMLInputElement).value
		}
	});
}

async function getLastGeneration() {
	last_generation.value = await useCustomFetch<string>('/api/karas/lastUpdate');
}

async function getState() {
	state.value = await useCustomFetch('/api/state');
}

async function getRepository() {
	repository.value = await useCustomFetch('/api/karas/repository');
}

getContributors();

if (import.meta.client && user?.value?.roles?.admin) {
	getRepository();
	getLastGeneration();
	getState();
}
</script>

<style lang="scss">
.is-flex {
	gap: 0.5em;
}

.box {
	min-width: 25%;
}
</style>
