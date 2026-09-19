<template>
	<div>
		<div class="select">
			<select id="level" v-model="level" name="level" autocomplete="off">
				<option value="error">
					Error
				</option>
				<option value="warn">
					Warning
				</option>
				<option value="info">
					Info
				</option>
				<option value="debug">
					Debug
				</option>
			</select>
		</div>
		<div v-for="(l, index) in logs" :key="index" class="box is-flex">
			<div
				:class="{
					'is-info tag': l.level === 'info',
					'is-warning tag': l.level === 'warn',
					'is-danger tag': l.level === 'error',
					'is-primary tag': l.level === 'debug'
				}"
			>
				{{ l.level }}</div>
			<div>{{ new Date(l.timestamp).toLocaleString() }}</div>
			<div class="tag">{{
				l.service }}</div>
			<div>{{ l.message }}</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { LogLevel, LogLine } from '%/lib/types/logger';
import { useAuthStore } from '~/store/auth';

const { user } = storeToRefs(useAuthStore());

const logs = ref<LogLine[]>();
const level = ref<LogLevel>('debug');

watch(level, getLogs);

if (import.meta.client && !user?.value?.roles?.admin) throw createError({ statusCode: 404 });

async function getLogs() {
	logs.value = await useCustomFetch('/api/logs', {
		method: 'POST',
		body: {
			level: level.value
		}
	});
}

getLogs();
</script>
<style lang="scss">
.select select option {
	color: #dbdee0;
}

.select {
	margin-bottom: 0.5em;
}

.box {
	margin-bottom: 0.5rem !important;
}

.tag {
	margin-left: 0.5em;
	margin-right: 0.5em;
}
</style>