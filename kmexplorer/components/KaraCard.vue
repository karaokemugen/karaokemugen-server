<template>
    <div class="box">
        <div class="header">
            <div class="title-block">
                <nuxt-link :to="`/kara/${slug}/${karaoke.kid}`" class="title is-3 is-spaced">
                    {{ karaoke.title }}
                </nuxt-link>
                <i18n path="kara.phrase" tag="h4" class="subtitle is-5">
                    <template v-slot:songtype>
                        <nuxt-link :to="`/tags/${songtypeSlug}/${karaoke.songtypes[0].tid}~3`">
                            {{ songtype }}
                        </nuxt-link>
                        {{ karaoke.songorder }}
                    </template>
                    <template v-slot:series>
                        <nuxt-link :to="`/tags/${serieSinger.slug}/${serieSinger.tid}`">
                            {{ serieSinger.name }}
                        </nuxt-link>
                    </template>
                </i18n>
				<h6 class="subtitle is-6 no-top-margin">
					<nuxt-link :to="`/years/${karaoke.year}`">{{ karaoke.year }}</nuxt-link>
				</h6>
            </div>
            <div class="images">
                <img :src="images[0]" alt="">
                <img :src="images[1]" :class="{activate}" alt="" @mouseenter="switchImage" @mouseleave="switchImage">
            </div>
        </div>
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
    import slug from 'slug';
    import { tagTypes } from "~/assets/constants";
    import Tag from '~/components/Tag.vue';

    export default Vue.extend({
        props: ['karaoke', 'i18n'],

        name: "KaraCard",

        data() {
            return {
                tagTypes,
                activate: false
            }
        },

        components: {
            Tag
        },

        methods: {
            switchImage() {
                this.activate = !this.activate;
            }
        },

        computed: {
            images() {
                return [
                    `/previews/${this.karaoke.kid}.${this.karaoke.mediasize}.25.jpg`,
                    `/previews/${this.karaoke.kid}.${this.karaoke.mediasize}.33.jpg`,
                    `/previews/${this.karaoke.kid}.${this.karaoke.mediasize}.50.jpg`
                ];
            },
            serieSinger() {
                if (this.karaoke.series[0]) {
                    return {
                        name: this.i18n[this.karaoke.series[0].tid]?
                            this.i18n[this.karaoke.series[0].tid][this.$i18n.locale]
                            || this.i18n[this.karaoke.series[0].tid]?.eng
                            || this.karaoke.series[0].name:this.karaoke.series[0].name,
                        tid: `${this.karaoke.series[0].tid}~${tagTypes.series.type}`,
                        slug: slug(this.karaoke.series[0].name)
                    };
                } else if (this.karaoke.singers[0]) {
                    return {
                        name: this.i18n[this.karaoke.singers[0].tid]?
                            this.i18n[this.karaoke.singers[0].tid][this.$i18n.locale]
                            || this.i18n[this.karaoke.singers[0].tid]?.eng
                            || this.karaoke.singers[0].name:this.karaoke.singers[0].name,
                        tid: `${this.karaoke.singers[0].tid}~${tagTypes.singers.type}`,
                        slug: slug(this.karaoke.singers[0].name)
                    };
                } else { // You never know~
                    return {
                        name: '¯\\_(ツ)_/¯',
                        tid: '6339add6-b9a3-46c4-9488-2660caa30487~1',
                        slug: 'wtf'
                    };
                }
            },
            songtype() {
                return this.i18n[this.karaoke.songtypes[0].tid]?
                    this.i18n[this.karaoke.songtypes[0].tid][this.$i18n.locale]
                    || this.i18n[this.karaoke.songtypes[0].tid]?.eng
                    || this.karaoke.songtypes[0].name:this.karaoke.songtypes[0].name;
            },
            songtypeSlug() {
                return slug(this.karaoke.songtypes[0].name);
            },
            slug() {
                return slug(this.karaoke.title);
            }
        }
    });
</script>

<style scoped lang="scss">
    .box {
        height: 100%;
        display: flex;
        flex-wrap: wrap;
    }
    .header {
        display: flex;
        justify-content: space-between;
        width: 100%;
    }
    .title, .subtitle {
        margin-bottom: unset;
        margin-top: unset;
    }
    .title-block {
        flex-basis: 70%;
    }
    .images {
        position: relative;
        width: 30%;
        float: right;
        flex-shrink: 0;
        img {
            border-radius: 4px;
        }
        img:last-child {
            position: absolute;
            left: 0;
            opacity: 0;
            transition: opacity 0.25s linear;
        }
        img:last-child.activate {
            opacity: 1;
        }
    }
    .tags {
        margin-top: 0.5rem;
        display: unset;
        .tag *:first-child {
            margin-right: 0.25rem;
        }
    }
</style>
