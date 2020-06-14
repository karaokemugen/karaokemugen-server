<template>
  <div>
    <nav class="navbar is-primary is-fixed-top">
      <div class="navbar-brand">
        <nuxt-link class="navbar-item" to="/">{{ hello }}</nuxt-link>
      </div>
      <div class="navbar-menu">
        <div class="navbar-start">
          <div class="navbar-item" v-if="tag">
            <tag :type="tag.type" :tag="tag.tag" :icon="true" :nolink="true" />
          </div>
          <div class="navbar-item is-expanded">
            <search-bar />
          </div>
        </div>
        <div class="navbar-end">
          <div class="navbar-item">
            Coucou
		  </div>
          <div v-if="import_enabled" class="navbar-item">
			<nuxt-link class="navbar-item" to="/import">Import</nuxt-link>
          </div>
        </div>
      </div>
    </nav>
    <div class="container is-fluid">
      <nuxt />
    </div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';
  import Tag from '~/components/Tag';
  import SearchBar from '~/components/SearchBar';

  export default Vue.extend({
    head: {
      htmlAttrs: {
        class: ['has-navbar-fixed-top']
      }
    },

    components: {
      Tag,
      SearchBar
    },

    data() {
      return {
        hello: 'KMExplorer',
        tag: null,
		import_enabled: process.env.KM_IMPORT
      }
    },

    created() {
      this.$store.subscribe((mutation, _state) => {
        if (mutation.type === 'menubar/setTag') {
          this.tag = mutation.payload;
        }
      });
    }
  });
</script>