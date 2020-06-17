<template>
    <LoginModal @close="goBack" />
</template>

<script lang="ts">
    import Vue from 'vue';
    import LoginModal from '../components/LoginModal.vue';

    export default Vue.extend({
        name: 'login',

        components: {
            LoginModal
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