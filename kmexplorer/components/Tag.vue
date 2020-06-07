<template>
    <nuxt-link :to="`/tags/${tag.tid}~${tagTypes[type].type}`" class="tag is-rounded is-medium" :class="tagTypes[type].class">
        <font-awesome-icon :icon="['fas', tagTypes[type].icon]" :fixed-width="true" v-if="icon" />
        {{ tag.i18n[$i18n.locale] || tag.i18n.eng || tag.name }}
    </nuxt-link>
</template>

<script lang="ts">
    import Vue from 'vue';
    import { tagTypes } from "../assets/constants";

    export default Vue.extend({
        name: "Tag",

        props: ['tag', 'icon', 'type'],

        data() {
            return {
                tagTypes
            }
        }
    });
</script>

<style scoped lang="scss">

</style>