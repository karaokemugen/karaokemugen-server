<template>
    <div class="box">
        <h1 class="title is-1">
            {{ karaoke.title }}
        </h1>
        <i18n path="kara.phrase" tag="h4" class="subtitle is-4">
            <template v-slot:songtype>
                <nuxt-link :to="`/tags/${karaoke.songtypes[0].tid}~3`">
                    {{ karaoke.songtypes[0].i18n[$i18n.locale] || karaoke.songtypes[0].i18n.eng || karaoke.songtypes[0].name }}
                </nuxt-link>
                {{ karaoke.songorder }}
            </template>
            <template v-slot:series>
                <nuxt-link :to="`/tags/${serieSinger.tid}`">
                    {{ serieSinger.name }}
                </nuxt-link>
            </template>
        </i18n>
        <h6 class="subtitle is-6 no-top-margin">
            {{ karaoke.year }}
        </h6>
        <table class="tagList">
            <tbody>
            <tr v-for="type in Object.keys(tagTypes)" v-if="karaoke[type].length > 0">
                <td>
                    <span class="name"><font-awesome-icon :icon="['fas', tagTypes[type].icon]" :fixed-width="true" /> {{ $tc(`kara.tagtypes.${type}`, karaoke[type].length) }}</span>
                </td>
                <td>
                    <div class="tags are-medium">
                        <tag :type="type" :tag="tag" v-for="tag in karaoke[type]" :key="tag.tid" :icon="false"></tag>
                    </div>
                </td>
            </tr>
            </tbody>
        </table>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';
    import { tagTypes } from "~/assets/constants";
    import Tag from '~/components/Tag.vue';

    export default Vue.extend({
        name: "KaraFullInfo",

        props: ['karaoke'],

        components: {
            Tag
        },

        data() {
            return {
                tagTypes
            }
        },

        computed: {
            serieSinger() {
                if (this.karaoke.series[0]) {
                    return {
                        name: this.karaoke.series[0].i18n[this.$i18n.locale] || this.karaoke.series[0].i18n.eng || this.karaoke.series[0].name,
                        tid: `${this.karaoke.series[0].tid}~${tagTypes.series.type}`
                    };
                } else if (this.karaoke.singers[0]) {
                    return {
                        name: this.karaoke.singers[0].i18n[this.$i18n.locale] || this.karaoke.singers[0].i18n.eng || this.karaoke.singers[0].name,
                        tid: `${this.karaoke.singers[0].tid}~${tagTypes.series.type}`
                    };
                } else {
                    return {
                        name: '¯\\_(ツ)_/¯',
                        tid: '6339add6-b9a3-46c4-9488-2660caa30487~1'
                    };
                }
            }
        }
    });
</script>

<style scoped lang="scss">
    .tagList {
        border-collapse: unset;
        border-spacing: 0 1em;
    }
    .tagList span.name {
        margin-right: 1em;
    }
    .subtitle.no-top-margin {
        margin-top: -1.25rem;
    }
</style>