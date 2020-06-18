<template>
	<div class="box">
		<h4 class="title is-4">Un problème avec {{ karaoke.title }} ?</h4>
		<button class="button is-warning">
			<font-awesome-icon :icon="['fas', 'meh']" />
			Signaler un problème
		</button>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';

    export default Vue.extend({
        name: 'KaraReport',

		props: ['karaoke']
    });
</script>

<style scoped>

</style>