<template>
  <li ref="element" class="item">
    <slot />
  </li>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useSortable } from '@dnd-kit/vue/sortable';

const props = defineProps<{id: number, index: number, disabled: boolean}>();

const element = ref(null);
useSortable({
  id: computed(() => props.id),
  index: computed(() => props.index),
  element,
  disabled: props.disabled
});
</script>

