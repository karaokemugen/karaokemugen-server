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
    import LoadingNanami from './LoadingNanami.vue';
    import KaraCard from './KaraCard.vue';

    export default Vue.extend({
        name: "KaraList",

        props: ['karaokes', 'loading'],

        components: {
            LoadingNanami,
            KaraCard
        }
    });
</script>

<style lang="scss" scoped>
    .tile.is-child.is-4 {
        padding: 0 1em;
    }
</style>