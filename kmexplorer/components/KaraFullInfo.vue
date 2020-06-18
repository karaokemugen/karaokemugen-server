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
            <nuxt-link :to="`/years/${karaoke.year}`">{{ karaoke.year }}</nuxt-link>
        </h6>
        <table class="tagList">
            <tbody>
                <tr v-for="type in Object.keys(tagTypesSorted)" v-if="karaoke[type].length > 0">
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
        <div class="buttons">
            <a :href="kmAppUrl" class="button is-success">
                <font-awesome-icon :icon="['fas', 'cloud-download-alt']" :fixed-width="true"></font-awesome-icon>
                {{$t('kara.add')}}
            </a>
            <button class="button is-warning" @click="toggleFavorite" v-if="favorite" :class="{'is-loading': loading}">
                <font-awesome-icon :icon="['fas', 'star']" :fixed-width="true"></font-awesome-icon>
                {{$t('kara.favorites.remove')}}
            </button>
            <button class="button is-warning" @click="toggleFavorite" v-else :class="{'is-loading': loading}">
                <font-awesome-icon :icon="['fas', 'star']" :fixed-width="true"></font-awesome-icon>
                {{$t('kara.favorites.add')}}
            </button>
            <a :href="bundleUrl" class="button" :download="`${serieSinger.name} - ${karaoke.title}.karabundle.json`">
                <font-awesome-icon :icon="['fas', 'file-export']" :fixed-width="true"></font-awesome-icon>
                {{$t('kara.download')}}
            </a>
        </div>
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
                tagTypes,
                favorite: false,
                loading: false
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
            },
            tagTypesSorted() {
                let tagTypes = this.tagTypes;
                delete tagTypes.songtypes; // Don't show songtypes on full view, as it's already shown in the title
                return tagTypes;
            },
            kmAppUrl() {
                return `km://download/${process.env.API_HOST}/${this.karaoke.kid}`;
            },
            bundleUrl() {
                return `${this.$axios.defaults.baseURL}api/karas/${this.karaoke.kid}/raw`;
            }
        },

        methods: {
            async toggleFavorite() {
                if (this.$auth.loggedIn) {
                    this.loading = true;
                    if (this.favorite) {
                        await this.$axios.delete(`/api/favorites/${this.karaoke.kid}`)
                    } else {
                        await this.$axios.post(`/api/favorites/${this.karaoke.kid}`)
                    }
                    this.favorite = !this.favorite;
                    this.loading = false;
                } else {
                    this.$router.push('/login');
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
        margin-right: 3em;
    }
    .subtitle.no-top-margin {
        margin-top: -1.25rem;
    }
</style>
