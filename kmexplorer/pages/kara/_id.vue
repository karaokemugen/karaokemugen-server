<template>
    <i18n path="kara.phrase" tag="h1">
        <template v-slot:karaoke>
            {{ karaoke.title }}
        </template>
        <template v-slot:series>
            <em v-for="series in karaoke.series" :key="series.tid">{{ series.name }}</em>
        </template>
    </i18n>
</template>

<script lang="ts">
    import Vue from 'vue';

    export default Vue.extend({
        name: "ShowKara",

        data() {
            return {
                karaoke: {}
            }
        },

        async asyncData({ params, $axios, error, app }) {
            try {
                const {data} = await $axios.get(`/api/karas/${params.id}`);
                return { karaoke: data };
            } catch (e) {
                error({ statusCode: 404, message: app.i18n.t('kara.notfound') });
            }
        }
    });
</script>

<style scoped>

</style>