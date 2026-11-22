<template>
    <div>
        <table class="table">
            <thead>
                <tr>
                    <th v-for="(item, idx) in fields" :key="idx">
                        {{ item.label }}
                    </th>
                </tr>
                <tr>
                    <th v-for="(item, idx) in fields" :key="idx">
                        <div v-if="item.searchable" class="control">
                            <input 
                                class="input"
                                type="text"
                                @input="(e) => updateFilters(item.key, (e.target as any).value)">
                        </div>
                    </th>
                </tr>
            </thead>
            <tbody v-if="filterData?.length > 0">
                <tr v-for="(item, index) in filterData" :key="index">
                    <td v-for="(field, idx) in fields" :key="idx">
                        <slot v-if="slots[field.key]" :name="field.key" :item="item" />
                        <div v-else>{{ (item as any)[field.key] }}</div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup lang="ts">
interface IStringIndex {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
}

const props = defineProps<{
    data: IStringIndex[],
    fields: { key: string, label: string, searchable?: boolean }[]
}>();

const filters = ref(new Map());
const filterData = ref(props.data);
const { t } = useI18n();

const updateFilters = (field: string, value: string) => {
    filters.value.set(field, value);
}

const updateFilterData = () => {
    let data = props.data;
    filters.value.forEach((value, key) => {
        data = data.filter((v: IStringIndex) => {
            if (typeof v[key] === 'boolean') {
                return searchBoolean(v[key], value);
            } else {
                return (v[key] as string).includes(value);
            }

        })
    });
    filterData.value = data;
}

const searchBoolean = (booleanAttribute: boolean, input: string) => {
    let inputBool: boolean | undefined;
    if (input.toLowerCase() === t('actions.yes').toLowerCase()) {
        inputBool = true;
    } else if (input.toLowerCase() === t('actions.no').toLowerCase()) {
        inputBool = false;
    }
    return inputBool === undefined || booleanAttribute === inputBool;
}

watch(props, updateFilterData);
watch(filters.value, updateFilterData);

const slots = useSlots();
</script>

<style lang="css">
table {
    width: 100%;
}
</style>