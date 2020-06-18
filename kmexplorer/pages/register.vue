<template>
    <RegisterModal @close="goBack" />
</template>

<script lang="ts">
    import Vue from 'vue';
    import RegisterModal from '../components/RegisterModal.vue';

    export default Vue.extend({
        name: 'register',

        components: {
            RegisterModal
        },

        methods: {
            goBack() {
                this.$router.go(-1);
            }
        },

        middleware: 'auth',
        auth: 'guest'
    });
</script>