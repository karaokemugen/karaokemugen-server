<template>
    <kara-list :karaokes="karaokes" :loading="loading"></kara-list>
</template>

<script lang="ts">
    import Vue from 'vue';
    import merge from 'lodash.merge';

    import KaraList from '~/components/KaraList.vue';
    import { menuBarStore } from "~/store";
    import { tagRegex, tagTypesMap } from "../../assets/constants";

    export default Vue.extend({
        name: "KaraListTag",

        components: {
            KaraList
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
		
		validate({ params }) {
			return params.id && tagRegex.exec(params.id);
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
                let bottomOfWindow = document.documentElement.scrollTop + window.innerHeight > document.documentElement.offsetHeight - 400;

                if (bottomOfWindow) {
                    this.loadNextPage();
                }
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

        mounted() {
            menuBarStore.setTag({
                type: tagTypesMap[tagRegex.exec(this.$route.params.id)[2]].name,
                tag: this.tag
            });
            window.addEventListener('scroll', this.scrollEvent);
        },

        destroyed() {
            menuBarStore.setTag(undefined);
            window.removeEventListener('scroll', this.scrollEvent);
        },

        watch: {
            loading(now, _old) {
                if (now) this.$nuxt.$loading.start();
                else this.$nuxt.$loading.finish();
            }
        }
    });
</script>