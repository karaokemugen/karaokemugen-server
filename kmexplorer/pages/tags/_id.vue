<template>
    <div class="tile is-ancestor">
        <div class="tile is-vertical">
            <div class="tile is-parent is-12" v-for="n in Math.floor(karaokes.infos.count / 3)">
                <div class="tile is-child is-4" v-for="n2 in 3">
                    <kara-card :karaoke="karaokes.content[(n-1)*3+n2-1]"></kara-card>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';
    import KaraCard from "~/components/KaraCard.vue";

    export default Vue.extend({
        name: "KaraListTag",

        components: {
            KaraCard
        },

        data() {
            return {
                karaokes: {infos: {count:0, from: 0, to: 0}, i18n: {}, content: []}
            }
        },

        async asyncData({ params, $axios, error, app }) {
            const {data} = await $axios.get(`/api/karas/search`, {
                params: {
                    q: `t:${params.id}`
                }
            }).catch(
                _err => error({ statusCode: 404, message: app.i18n.t('kara.notfound') }));
            return { karaokes: data };
        }
    });
</script>

<style lang="scss" scoped>
    .tile.is-child.is-4 {
        padding: 0 1em;
    }
</style>