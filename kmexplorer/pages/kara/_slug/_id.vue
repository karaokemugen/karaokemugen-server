<template>
    <div class="tile is-ancestor">
        <div class="tile is-parent is-12">
            <div class="tile is-child" :class="{'is-8': !liveOpened, 'is-4': liveOpened}">
                <kara-full-info :karaoke="karaoke"></kara-full-info>
            </div>
            <div class="tile is-4-desktop-only is-parent is-vertical">
                <div class="tile is-child" v-if="liveURL">
                    <live-player :karaoke="karaoke" v-on:open="placeForLive"></live-player>
                </div>
                <div class="tile is-child" v-else>
                    <div class="box">
                        <img :src="`/previews/${karaoke.kid}.${karaoke.mediasize}.25.jpg`" alt="">
                    </div>
                </div>
                <div class="tile is-child" v-show="!liveOpened">
                    <div class="box">
                        <div class="imgGroup">
                            <img :src="`/previews/${karaoke.kid}.${karaoke.mediasize}.33.jpg`" alt="">
                            <img :src="`/previews/${karaoke.kid}.${karaoke.mediasize}.50.jpg`" alt="">
                        </div>
                    </div>
                </div>
                <div class="tile is-child">
                    <kara-report :karaoke="karaoke"></kara-report>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';
    import LivePlayer from '~/components/LivePlayer.vue';
    import KaraFullInfo from '~/components/KaraFullInfo.vue';
    import KaraReport from '~/components/KaraReport.vue';

    export default Vue.extend({
        name: "ShowKara",

        components: {
            LivePlayer,
            KaraFullInfo,
            KaraReport
        },

        data() {
            return {
                karaoke: {},
                liveURL: process.env.LIVE_URL,
                liveOpened: false
            }
        },

        methods: {
            placeForLive() {
                this.liveOpened = true;
            }
        },

        async asyncData({ params, $axios, error, app }) {
            const {data} = await $axios.get(`/api/karas/${params.id}`).catch(
                _err => error({ statusCode: 404, message: app.i18n.t('kara.notfound') }));
            return { karaoke: data };
        },

        head() {
            return {
                title: this.karaoke.title
            }
        }
    });
</script>

<style scoped lang="scss">
    .tile .is-child {
        transition: width 0.8s;
    }
    .imgGroup {
        display: flex;
        flex-wrap: nowrap;
        img {
            // Stupid workaround for Chrom*-based browsers
            // https://discordapp.com/channels/84245347336982528/324208228680466434/718601114618036254
            width: 100%;
            height: 100%;
            min-width: 0;
        }
        img:last-child {
            margin-left: 0.25em;
        }
    }
    .tile.is-vertical {
        padding: 0 1em;
    }
</style>