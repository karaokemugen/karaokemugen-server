<template>
    <div class="field is-expanded">
        <div class="control">
            <input class="input is-fullwidth" type="text" :placeholder="$t('menu.search_placeholder')" v-model="search" @keydown.enter="triggerSearch">
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

<style scoped lang="scss">
    .field.is-expanded {
        flex-grow: 1;
        flex-shrink: 0;
        // width: 75vw;
    }
</style>
