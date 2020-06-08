<template>
    <div class="tile is-ancestor">
        <div class="tile is-vertical">
            <div class="tile is-parent is-12" v-for="n in Math.ceil(karaokes.infos.to / 3)">
                <div class="tile is-child is-4" v-for="n2 in 3">
                    <kara-card :karaoke="karaokes.content[(n-1)*3+n2-1]" :i18n="karaokes.i18n" v-if="karaokes.content[(n-1)*3+n2-1]"></kara-card>
                </div>
            </div>
            <loading-nanami class="tile is-parent is-12" v-if="loading"></loading-nanami>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';
    import merge from 'lodash.merge';

    import KaraCard from '~/components/KaraCard.vue';
    import LoadingNanami from '~/components/LoadingNanami.vue';
    import { menuBarStore } from "~/store";
    import { tagRegex, tagTypesMap } from "../../assets/constants";

    export default Vue.extend({
        name: "KaraListTag",

        components: {
            KaraCard,
            LoadingNanami
        },

        data() {
            return {
                karaokes: {infos: {count:0, from: 0, to: 0}, i18n: {}, content: []},
                from: 0,
                loading: false,
                tag: {
                    name: ''
                }
            }
        },

        methods: {
            async loadNextPage() {
                if (this.karaokes.infos.to === this.karaokes.infos.count || this.loading) return;
                this.from++;
                this.loading = true;
                const {data} = await this.$axios.get(`/api/karas/search`, {
                    params: {
                        q: `t:${this.$route.params.id}`,
                        from: (this.from * 20),
                        size: ((this.from+1) * 20)
                    }
                });
                this.karaokes.content.push(...data.content);
                this.karaokes.i18n = merge(this.karaokes.i18n, data.i18n);
                this.karaokes.infos.to = data.infos.to;
                this.loading = false;
            },
            scrollEvent() {
                window.addEventListener('scroll', () => {
                    let bottomOfWindow = document.documentElement.scrollTop + window.innerHeight > document.documentElement.offsetHeight - 400;

                    console.log(bottomOfWindow);

                    if (bottomOfWindow) {
                        this.loadNextPage();
                    }
                });
            }
        },

        async asyncData({ params, $axios, error, app }) {
            const { data } = await $axios.get(`/api/tags/${tagRegex.exec(params.id)[1]}`).catch(
                _err => error({ statusCode: 404, message: app.i18n.t('tag.notfound') }));

            const { data: data2 } = await $axios.get(`/api/karas/search`, {
                params: {
                    q: `t:${params.id}`,
                    from: 0,
                    size: 20
                }
            }).catch(
                _err => error({ statusCode: 404, message: app.i18n.t('error.generic') }));
            return { karaokes: data2, tag: data };
        },

        transition: 'fade',

        created() {
            menuBarStore.setTag({
                type: tagTypesMap[tagRegex.exec(this.$route.params.id)[2]].name,
                tag: this.tag
            });
        },

        destroyed() {
            menuBarStore.setTag(undefined);
        },

        mounted() {
            this.scrollEvent();
        },

        watch: {
            loading(now, _old) {
                if (now) this.$nuxt.$loading.start();
                else this.$nuxt.$loading.finish();
            }
        }
    });
</script>

<style lang="scss" scoped>
    .tile.is-child.is-4 {
        padding: 0 1em;
    }
</style>