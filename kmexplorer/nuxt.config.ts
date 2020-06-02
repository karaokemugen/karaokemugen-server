export let NuxtConfig = {
    mode: 'universal',
    dev: false,
    /*
    ** Nuxt.js dev-modules
    */
    buildModules: [
        '@nuxt/typescript-build'
    ],
    modules: [
        // Doc: https://axios.nuxtjs.org/usage
        '@nuxtjs/axios',
    ],
    router: {
        base: '/base/'
    },
    modulesDir: ['../node_modules/'],
    rootDir: 'kmexplorer/'
};