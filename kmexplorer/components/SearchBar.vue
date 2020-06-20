<template>
    <div class="field is-expanded has-addons">
        <div class="control is-expanded">
            <input class="input is-fullwidth" type="text" :placeholder="$t('search.placeholder')" v-model="search" @keydown.enter="triggerSearch">
        </div>
		<div class="control">
			<span class="select">
				<select :aria-label="$t('search.aria.sort')" v-model="sort">
					<option value="az" selected>{{ $t('search.sort.a_z') }}</option>
					<option value="karacount">{{ $t('search.sort.kara_count') }}</option>
					<option value="recent">{{ $t('search.sort.recent') }}</option>
					<option value="most_played">{{ $t('search.sort.most_played') }}</option>
					<option value="most_favorites">{{ $t('search.sort.most_favorites') }}</option>
					<option value="most_requested">{{ $t('search.sort.most_requested') }}</option>
				</select>
			</span>
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
                search: '',
				sort: 'az'
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
            },
			sort(now, _old) {
            	menuBarStore.setSort(now);
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
        .select select option {
            color: white;
        }
    }
</style>
