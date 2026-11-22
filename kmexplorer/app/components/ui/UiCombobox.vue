<template>
	<Presence :present="!createTag">
		<ComboboxRoot
			id="combobox-root" v-model:model-value="model" :ignore-filter="ignoreFilter" :reset-model-value-on-clear="true" class="combobox-root">
			<ComboboxAnchor class="is-flex">
				<ComboboxInput
					v-model:model-value="filter"
					class="input"
					:display-value="(v) => clearOnFocus ? '' : v?.label"
					:placeholder="placeholder"
				/>
				<ComboboxCancel v-if="deleteButton">
					<font-awesome-icon fixed-width :icon="['fas', 'trash']" />
				</ComboboxCancel>
			</ComboboxAnchor>
			<ComboboxPortal>
				<ComboboxContent
					position="popper"
					align="start"
					class="combobox-content"
					:style="getStyles"
				>
					<slot name="header" />
					<ComboboxViewport>
							<ComboboxItem 
						v-for="item in items"
						:key="String(keyAttribute ? item.value[keyAttribute] : item.value)"
						:value="item"
								class="combobox-item"
							>
								<span>
							{{ item.label }}
								</span>
							</ComboboxItem>
					</ComboboxViewport>
				</ComboboxContent>
			</ComboboxPortal>
		</ComboboxRoot>
	</Presence>
</template>


<script setup lang="ts" generic="T">
import {
  ComboboxAnchor,
  ComboboxCancel,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxPortal,
  ComboboxRoot,
  ComboboxViewport,
  Presence,
} from 'reka-ui'
import { useModalStore } from '~/store/modal';
const props = withDefaults(defineProps<{
	items: { label: string; value: T }[],
	height?: string,
	placeholder?: string,
	ignoreFilter?: boolean,
	clearOnFocus?: boolean,
	deleteButton?: boolean,
	keyAttribute?: keyof T
}>(), {
	placeholder: undefined,
	height: undefined,
	ignoreFilter: true,
	clearOnFocus: false,
	deleteButton: true,
	keyAttribute: undefined
});

const { createTag } = storeToRefs(useModalStore());
const model = defineModel<{label: string, value: T} | undefined>('model', { default: undefined });
const filter = defineModel<string | undefined>('filter', { default: undefined });

const getStyles = computed(() => {
	const styles: { '--reka-combobox-content-available-height'?: string, '--reka-combobox-content-available-min-width'?: string} = {};
	if (props.height) styles['--reka-combobox-content-available-height'] = props.height;
	return styles;
});
</script>

<style lang="scss">

.combobox-content {
	max-height: var(--reka-combobox-content-available-height);
	overflow: auto;
	width: var(--reka-combobox-trigger-width);
}
</style>

<style lang="scss">

.combobox-content {
	z-index: 2;
	position: absolute;
	background-color: #282f2f;
	border-radius: .4em;
	box-shadow: 0 .5em 1em -.125em #0a0a0a1a, 0 0 0 1px #0a0a0a05;
	padding-bottom: .5rem;
	padding-top: .5rem;

	.combobox-item {
		padding: .375rem 0.5rem;
		font-size: 0.9rem;

		&:hover {
			background-color: #36393F;
		}
	}

	&>p {
		padding: .5em 1em;
		min-width: 18em;
	}
}
</style>
