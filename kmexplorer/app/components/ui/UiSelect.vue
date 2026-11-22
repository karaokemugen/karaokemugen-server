<template>
	<SelectRoot v-model:model-value="model" multiple>
		<SelectTrigger class="button">
			<font-awesome-icon fixed-width :icon="['fas', 'chevron-down']" />
			{{ buttonLabel }}
		</SelectTrigger>
		<SelectPortal>
			<SelectContent
				position="popper"
				class="select-content"
				:style="height && {'--reka-select-content-available-height': height}"
			>
				<p v-if="description">{{ description }}</p>
				<SelectItem 
					v-for="item in items"
					:key="String(keyAttribute ? item.value[keyAttribute] : item.value)"
					:disabled="isDisabled ? isDisabled(item.value) : false"
					:value="(item as AcceptableValue)"
					class="select-item"
				>
					<SelectItemIndicator>
						<font-awesome-icon fixed-width :icon="['fas', 'check']" />
					</SelectItemIndicator>
					<SelectItemText class="select-label">
						{{ item.label }}
					</SelectItemText>
				</SelectItem>
			</SelectContent>
		</SelectPortal>
	</SelectRoot>
</template>


<script setup lang="ts" generic="T">
import {
	SelectItem,
	SelectContent,
	SelectItemIndicator,
	SelectItemText,
	SelectPortal,
	SelectRoot,
	SelectTrigger,
	type AcceptableValue,
} from 'reka-ui'

defineProps<{
	buttonLabel: string,
	description?: string,
	items: { label: string; value: T }[],
	keyAttribute?: keyof T,
	height?: string,
	isDisabled?: (item: T) => boolean,
}>();

const model = defineModel<{label: string, value: T}[] | undefined>('model', { default: undefined });

</script>

<style lang="scss">

[data-reka-popper-content-wrapper] {
	z-index: 100 !important;
}

.select-content {
	max-height: var(--reka-select-content-available-height);
	overflow: auto;
}
</style>

<style lang="scss">

.select-content {
	background-color: #282f2f;
	border-radius: .4em;
	box-shadow: 0 .5em 1em -.125em #0a0a0a1a, 0 0 0 1px #0a0a0a05;
	padding-bottom: .5rem;
	padding-top: .5rem;

	.select-item {
		padding: .375rem 0.5rem;
		display: flex;
		font-size: 0.9rem;

		&:hover {
			background-color: #36393F;
		}
		.select-label {
			user-select: none;
			padding-left: 25px;
		}

		&[data-state="checked"] {
			background-color: #3ee4c4;
			color: #000000b3;

			.select-label {
				padding-left: 5px;
			}
		}
	}

	&>p {
		padding: .5em 1em;
		min-width: 18em;
	}
}
</style>
