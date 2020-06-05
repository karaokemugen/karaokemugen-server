<template>
  <div class="container">
    <div>
      <logo />
      <h1 class="title">
        KMExplorer
      </h1>
      <h2 class="subtitle">
        Explore! Find! Sing!
      </h2>
      <div class="links">
        <a
          href="https://nuxtjs.org/"
          target="_blank"
          rel="noopener noreferrer"
          class="button--green"
        >
          Documentation
        </a>
        <a
          href="https://github.com/nuxt/nuxt.js"
          target="_blank"
          rel="noopener noreferrer"
          class="button--grey"
        >
          GitHub
        </a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue'
  import Logo from '~/components/Logo'

  export default Vue.extend({
    components: {
      Logo
    }
  });
</script>
