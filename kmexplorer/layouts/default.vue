<template>
  <div>
    <nav class="navbar is-primary is-fixed-top">
      <div class="navbar-brand">
        <nuxt-link class="navbar-item" to="/">KMExplorer</nuxt-link>
      </div>
    </nav>
    <div class="container is-fluid">
      <nuxt />
    </div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';

  export default Vue.extend({
    head: {
      htmlAttrs: {
        class: ['has-navbar-fixed-top']
      }
    }
  });
</script>