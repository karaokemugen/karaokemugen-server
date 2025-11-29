<template>
	<div>
		<div v-if="user?.roles?.admin" class="is-flex">
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
						{{ contributor.nickname }}
						<select :selected="contributor.contributor_trust_level" @change="(event) => updateContributorLevel(event, contributor)">
							<option
								v-for="key in Object.keys(config?.Frontend.Import.ContributorTrustLevels)"
								:key="key"
								:value="key"
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
import type { UserList } from '%/types/user';
import * as Toast from 'vue-toastification';
import { useAuthStore } from '~/store/auth';
import { useConfigStore } from '~/store/config';

// @ts-expect-error vue-toastification is not typed
const useToast = Toast.useToast ?? Toast.default.useToast;
const { user } = storeToRefs(useAuthStore());

const { t } = useI18n();
const toast = useToast();
const { config } = storeToRefs(useConfigStore());

const contributors = ref<DBUser[]>([]);

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
			role: 'contributor'
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

getContributors();
</script>

<style lang="scss">
.is-flex {
	gap: 0.5em;
}

.box {
	min-width: 25%;
}
</style>
