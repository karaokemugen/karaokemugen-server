<template>
    <nuxt-link :to="nolink ? ``:`/tags/${tag.tid}~${tagTypes[type].type}`" class="tag is-rounded is-medium" :class="tagTypes[type].class">
        <font-awesome-icon :icon="['fas', tagTypes[type].icon]" :fixed-width="true" v-if="icon" />
        {{ localizedName }}
    </nuxt-link>
</template>

<script lang="ts">
    import Vue from 'vue';
    import { tagTypes } from "../assets/constants";

    export default Vue.extend({
        name: "Tag",

        props: ['tag', 'icon', 'type', 'i18n', 'nolink'],

        data() {
            return {
                tagTypes
            }
        },

        computed: {
            localizedName() {
                if (this.i18n) {
                    return this.i18n[this.$i18n.locale] || this.i18n.eng || this.tag.name;
                } else {
                    return this.tag.i18n ? this.tag.i18n[this.$i18n.locale] || this.tag.i18n.eng:this.tag.name;
                }
            }
        }
    });
</script>

<style scoped lang="scss">
    .svg-inline--fa {
        margin-right: 0.25rem;
    }
</style>