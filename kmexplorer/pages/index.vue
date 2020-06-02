<template>
    <h1>Test ! <test></test></h1>
</template>

<script lang="ts">
    import Vue from 'vue'
    import Test from '~/components/test'

    export default Vue.extend({
        name: "index",

        components: {
            Test
        }
    })
</script>

<style scoped>

</style>