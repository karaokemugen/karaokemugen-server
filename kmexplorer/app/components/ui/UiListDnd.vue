<template>
  <ui-pagination
    v-if="paginated"
    :page="currentPage"
    :last-page="lastPage"
    @page="(page: number) => emit('page', page as never)"
  />
  <div class="list-dnd">
    <DragDropProvider @drag-end="(event) => emit('drop', event as never)">
      <div v-for="(item, index) in data" :key="index">
        <SortableItem
            v-if="item"
            :id="(item as any)[idAttribute]"
            :key="index"
            :index="index"
            :disabled="!draggable"
          >
          <slot v-bind="item" />
        </SortableItem>
      </div>

    </DragDropProvider>
  </div>
  <ui-pagination
    v-if="paginated"
    :page="currentPage"
    :last-page="lastPage"
    @page="(page: number) => emit('page', page as never)"
  />
</template>

<script setup lang="ts">
import { DragDropProvider } from '@dnd-kit/vue';
import SortableItem from './SortableItem.vue';

const props = withDefaults(defineProps<{
  data: object[],
  draggable?: boolean,
  paginated: boolean
  perPage?: number,
  total: number,
  currentPage?: number,
  idAttribute?: string
}>(), {
  draggable: false,
  perPage: 300,
  currentPage: 1,
  idAttribute: 'id'
});

const lastPage = computed(() =>  Math.ceil(props.total / props.perPage));

const emit = defineEmits<{ (e: 'drop' | 'page', payload: never): void }>();
</script>

<style lang="scss">
.list-dnd .box {
  padding: 0.25em 0.5em;
  border: 1px solid rgb(37.024026512%, 42.6909693455%, 43.4465617233%);
  border-width: 0 0 1px;
  border-radius: 0px;
}
</style>
