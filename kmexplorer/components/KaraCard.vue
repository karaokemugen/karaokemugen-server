<template>
    <div class="box">
        <nuxt-link :to="`/kara/${karaoke.kid}`" class="title is-3">
            {{ karaoke.title }}
        </nuxt-link>
        <div class="tags are-medium">
            <template v-for="type in Object.keys(tagTypes)" v-if="karaoke[type].length > 0">
                <!--<nuxt-link :to="`/tags/${tag.tid}~${tagTypes[type].type}`" class="tag is-rounded is-medium" :class="tagTypes[type].class" v-for="tag in karaoke[type]" :key="`${tag.tid}~${tagTypes[type].type}`">
                    <font-awesome-icon :icon="['fas', tagTypes[type].icon]" :fixed-width="true" /> {{ i18n[tag.tid]? i18n[tag.tid][$i18n.locale] || i18n[tag.tid].eng:tag.name }}
                </nuxt-link>-->
                <tag v-for="tag in karaoke[type]" :key="`${tag.tid}~${tagTypes[type].type}`"
                     :type="type" :tag="tag" :i18n="i18n[tag.tid]" :icon="true"/>
            </template>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';
    import { tagTypes } from "~/assets/constants";
    import Tag from '~/components/Tag.vue';

    export default Vue.extend({
        props: ['karaoke', 'i18n'],

        name: "KaraCard",

        data() {
            return {
                tagTypes
            }
        },

        components: {
            Tag
        }
    });
</script>

<style scoped lang="scss">
    .box {
        height: 100%;
    }
    .tags {
        margin-top: 1.5rem;
        .tag *:first-child {
            margin-right: 0.25rem;
        }
    }
</style>