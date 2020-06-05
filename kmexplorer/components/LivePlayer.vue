<template>
    <div class="box">
        <iframe :src="`${liveURL}?video=${karaoke.kid}&autoplay=1`" :class="{live: transition}" allowfullscreen v-if="show"></iframe>
        <img :src="`/previews/${karaoke.kid}.${karaoke.mediasize}.25.jpg`" v-else @click="showPlayer">
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';

    export default Vue.extend({
        name: "LivePlayer",

        props: ['karaoke'],

        data() {
            return {
                liveURL: process.env.LIVE_URL,
                show: false,
                transition: false
            }
        },

        methods: {
            createTransition() {
                this.transition = true;
            },
            showPlayer() {
                this.show = true;
                this.$emit('open');
            }
        },

        updated() {
            if (this.show && !this.transition) {
                this.$nextTick(() => {
                    setTimeout(this.createTransition, 25);
                });
            }
        }
    });
</script>

<style scoped>
    .box *:first-child {
        width: 100%;
        height: 18vw;
        transition: height 0.8s;
    }
    @media (min-width: 700px) {
        .box *:first-child.live {
            height: 34vw;
        }
    }
    .box img {
        object-fit: cover;
        cursor: pointer;
    }
</style>