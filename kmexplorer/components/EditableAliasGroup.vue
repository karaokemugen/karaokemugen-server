<template>
	<div>
		<div class="tags">
			<span v-for="alias in values" :key="alias" class="tag">
				{{ alias }}
				<a class="delete is-small" @click.prevent="() => deleteValue(alias)" />
			</span>
			<div v-if="!inputVisible" class="button tag is-small" @click="inputVisible = true">
				<font-awesome-icon :icon="['fas', 'plus']" />
				{{ $t('kara.import.add') }}
			</div>
		</div>
		<div v-if="inputVisible">
			<input
				ref="input"
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

<script lang="ts">
	import Vue, { PropOptions } from 'vue';

	interface VState {
		values: string[],
		inputVisible: boolean,
		currentVal: string,
		loading: boolean
	}

	export default Vue.extend({
		name: 'EditableAliasGroup',

		props: {
			params: {
				type: Array
			} as PropOptions<string[]>
		},

		data(): VState {
			return {
				values: this.params || [],
				inputVisible: false,
				currentVal: '',
				loading: false
			};
		},

		watch: {
			params(now) {
				// Process resets
				if (now.length === 0) {
					this.values = [];
				}
			},
			inputVisible(now) {
				if (now) {
					this.$nextTick(() => {
						(this.$refs.input as any).focus();
					});
				}
			},
			values(now, old) {
				if (old.length !== 0 || now.length !== 0) {
					this.$emit('change', now);
				}
			}
		},

		methods: {
			addValue() {
				if (this.currentVal) {
					const values: string[] = this.values;
					values.push(this.currentVal);
					this.values = values;
				}
				this.inputVisible = false;
				this.currentVal = '';
			},
			deleteValue(option: string) {
				this.values = this.values.filter(alias => alias !== option);
			}
		}
	});
</script>
