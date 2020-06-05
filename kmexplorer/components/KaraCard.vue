<template>
    <div class="box">
        <nuxt-link :to="`/kara/${karaoke.kid}`" class="title is-3">
            {{ karaoke.title }}
        </nuxt-link>
        <div class="tags are-medium">
            <template v-for="type in Object.keys(tagTypes)" v-if="karaoke[type].length > 0">
                    <nuxt-link :to="`/tags/${tag.tid}~${tagTypes[type].type}`" class="tag is-rounded is-medium" :class="tagTypes[type].class" v-for="tag in karaoke[type]" :key="tag.tid">
                        <font-awesome-icon :icon="['fas', tagTypes[type].icon]" :fixed-width="true" /> {{ tag.name }} <!-- TODO: Populate with i18n data -->
                    </nuxt-link>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';
    import { tagTypes } from "~/assets/constants";

    export default Vue.extend({
        props: ['karaoke'],

        name: "KaraCard",

        data() {
            return {
                tagTypes
            }
        }
    });
</script>

<style scoped>
    .tags {
        margin-top: 1.5rem;
    }
</style>