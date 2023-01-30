<template>
	<div>
		<div class="tags">
			<span
				v-for="alias in values"
				:key="alias"
				class="tag"
			>
				{{ alias }}
				<nuxt-link
					class="delete is-small"
					@click.prevent="() => deleteValue(alias)"
				/>
			</span>
			<div
				v-if="!inputVisible"
				class="button tag is-small"
				@click="inputVisible = true"
			>
				<font-awesome-icon :icon="['fas', 'plus']" />
				{{ $t('kara.import.add') }}
			</div>
		</div>
		<div v-if="inputVisible">
			<input
				ref="inputToFocus"
				v-model="currentVal"
				type="text"
				class="input mb-4"
			>
			<button
				class="button"
				:class="{'is-loading': loading}"
				@click="addValue"
			>
				<font-awesome-icon :icon="['fas', 'plus']" />
				<span>{{ $t('kara.import.add') }}</span>
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
	const props = defineProps<{
		params: string[]
	}>();

	const emit = defineEmits<{(e: 'change', value: string[]): void}>();

	const values = ref<string[]>(props.params || []);
	const inputVisible = ref(false);
	const currentVal = ref('');
	const loading = ref(false);
	const inputToFocus = ref<HTMLElement>();

	watch([inputVisible], ([newInputVisible]) => {
		if (newInputVisible) {
			nextTick(() => {
				inputToFocus.value?.focus();
			});
		}
	}, { deep: true });

	const addValue = () => {
		if (currentVal.value) {
			values.value.push(currentVal.value);
		}
		inputVisible.value = false;
		currentVal.value = '';
		emit('change', values.value);
	};
	const deleteValue = (option: string) => {
		values.value = values.value.filter(alias => alias !== option);
		emit('change', values.value);
	};
</script>
