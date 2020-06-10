<template>
    <div class="field">
        <div class="control is-expanded">
            <input class="input is-fullwidth" type="text" placeholder="" v-model="search" @keydown.enter="triggerSearch">
        </div>
    </div>
</template>

<script lang="ts">
    import Vue from 'vue';
    import { menuBarStore } from "~/store";

    export default Vue.extend({
        name: "SearchBar",

        data() {
            return {
                search: ''
            }
        },

        methods: {
            triggerSearch() {
                this.$router.push(`/search/${this.search}`);
            }
        },

        watch: {
            search(now, _old) {
                menuBarStore.setSearch(now);
            }
        },

        mounted() {
            this.$store.subscribe((mutation, _state) => {
                if (mutation.type === 'menubar/setSearch') {
                    this.search = mutation.payload;
                }
            });
        }
    });
</script>

<style scoped>

</style>