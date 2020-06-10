<template>
    <nuxt-link :to="nolink ? ``:`/tags/${tag.tid}~${tagTypes[type].type}`" class="tag is-medium"
               :class="tagTypes[type].class">
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
                    /* Name resolving strategy
                    return this.tag.i18n?.hasOwnProperty(this.$i18n.locale) ? // If i18n exists in user language
                        this.tag.i18n[this.$i18n.locale]: // Display this
                        this.tag.i18n?.hasOwnProperty('eng') ? this.tag.i18n.eng // Else, fallback on English or worst!
                            :this.tag.name; // The tag raw name
                    // Why not this.tag.i18n[this.$i18n.locale]? Because we cannot do speculative access (?.) before []
                    // It returns an error if this.tag.i18n is undefined
                    */
                    if (this.tag.i18n) {
                        return this.tag.i18n[this.$i18n.locale] || this.tag.i18n.eng || this.tag.name;
                    } else {
                        return this.tag.name;
                    }
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