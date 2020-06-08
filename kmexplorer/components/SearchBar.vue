<template>
    <div class="field">
        <div class="control is-expanded">
            <input class="input is-fullwidth" type="text" placeholder="" v-model="search" @keydown.enter="triggerSearch">
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';

    export default Vue.extend({
        name: "SearchBar",

        data() {
            return {
                search: ''
            }
        },

        methods: {
            triggerSearch() {
                this.$router.push();
            }
        }
    });
</script>

<style scoped>

</style>