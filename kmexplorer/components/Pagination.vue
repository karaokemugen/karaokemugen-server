<template>
	<nav class="pagination" role="navigation" aria-label="pagination">
		<a v-if="page > 1" class="pagination-previous" @click="changePage(page - 1)">{{ $t('search.previous') }}</a>
		<a v-if="page !== lastPage" class="pagination-next" @click="changePage(page + 1)">{{ $t('search.next') }}</a>
		<ul class="pagination-list">
			<li v-if="page > 3">
				<a class="pagination-link" :aria-label="$t('search.aria.goto', [1])" @click="changePage(1)">1</a>
			</li>
			<li v-if="page > 4">
				<span class="pagination-ellipsis">&hellip;</span>
			</li>
			<li v-if="page > 2">
				<a
					class="pagination-link"
					:aria-label="$t('search.aria.goto', [page - 2])"
					@click="changePage(page - 2)"
				>{{ page-2 }}</a>
			</li>
			<li v-if="page > 1">
				<a
					class="pagination-link"
					:aria-label="$t('search.aria.goto', [page - 1])"
					@click="changePage(page - 1)"
				>{{ page-1 }}</a>
			</li>
			<li>
				<a class="pagination-link is-current" :aria-label="$t('search.aria.page', [page])" aria-current="page">{{
					page }}</a>
			</li>
			<li v-if="page < (lastPage - 1)">
				<a
					class="pagination-link"
					:aria-label="$t('search.aria.goto', [page + 1])"
					@click="changePage(page + 1)"
				>{{ page+1 }}</a>
			</li>
			<li v-if="page < (lastPage - 2)">
				<a
					class="pagination-link"
					:aria-label="$t('search.aria.goto', [page + 2])"
					@click="changePage(page + 2)"
				>{{ page+2 }}</a>
			</li>
			<li v-if="page < (lastPage - 3)">
				<span class="pagination-ellipsis">&hellip;</span>
			</li>
			<li v-if="page <= (lastPage - 1)">
				<a
					class="pagination-link"
					:aria-label="$t('search.aria.goto', [lastPage])"
					@click="changePage(lastPage)"
				>{{ lastPage }}</a>
			</li>
		</ul>
	</nav>
</template>

<script lang="ts">
	import Vue from 'vue';

	export default Vue.extend({
		props: {
			page: {
				type: Number,
				required: true
			},
			lastPage: {
				type: Number,
				required: true
			}
		},

		methods: {
			changePage(page: number) {
				this.$emit('page', page);
			}
		}
	});
</script>
