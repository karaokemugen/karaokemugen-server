<template>
	<nav
		class="pagination"
		role="navigation"
		aria-label="pagination"
	>
		<nuxt-link
			v-if="page > 1"
			class="pagination-previous"
			@click="changePage(page - 1)"
		>
			{{ $t('search.previous') }}
		</nuxt-link>
		<nuxt-link
			v-if="page !== lastPage"
			class="pagination-next"
			@click="changePage(page + 1)"
		>
			{{ $t('search.next') }}
		</nuxt-link>
		<ul
			v-if="showAll"
			class="pagination-list"
		>
			<li
				v-for="n in lastPage"
				:key="n"
			>
				<nuxt-link
					class="pagination-link"
					:class="{'is-current': n === page}"
					:aria-current="n === page"
					:aria-label="$t('search.aria.goto', [n])"
					@click="changePage(n)"
				>
					{{ n }}
				</nuxt-link>
			</li>
		</ul>
		<ul
			v-else
			class="pagination-list"
		>
			<li v-if="page > 3">
				<nuxt-link
					class="pagination-link"
					:aria-label="$t('search.aria.goto', [1])"
					@click="changePage(1)"
				>
					1
				</nuxt-link>
			</li>
			<li
				v-if="page > 4"
				@click="showAll = true"
			>
				<span class="pagination-ellipsis">&hellip;</span>
			</li>
			<li v-if="page > 2">
				<nuxt-link
					class="pagination-link"
					:aria-label="$t('search.aria.goto', [page - 2])"
					@click="changePage(page - 2)"
				>
					{{ page-2 }}
				</nuxt-link>
			</li>
			<li v-if="page > 1">
				<nuxt-link
					class="pagination-link"
					:aria-label="$t('search.aria.goto', [page - 1])"
					@click="changePage(page - 1)"
				>
					{{ page-1 }}
				</nuxt-link>
			</li>
			<li>
				<nuxt-link
					class="pagination-link is-current"
					:aria-label="$t('search.aria.page', [page])"
					aria-current="page"
				>
					{{
						page }}
				</nuxt-link>
			</li>
			<li v-if="page < (lastPage - 1)">
				<nuxt-link
					class="pagination-link"
					:aria-label="$t('search.aria.goto', [page + 1])"
					@click="changePage(page + 1)"
				>
					{{ page+1 }}
				</nuxt-link>
			</li>
			<li v-if="page < (lastPage - 2)">
				<nuxt-link
					class="pagination-link"
					:aria-label="$t('search.aria.goto', [page + 2])"
					@click="changePage(page + 2)"
				>
					{{ page+2 }}
				</nuxt-link>
			</li>
			<li
				v-if="page < (lastPage - 3)"
				@click="showAll = true"
			>
				<span class="pagination-ellipsis">&hellip;</span>
			</li>
			<li v-if="page <= (lastPage - 1)">
				<nuxt-link
					class="pagination-link"
					:aria-label="$t('search.aria.goto', [lastPage])"
					@click="changePage(lastPage)"
				>
					{{ lastPage }}
				</nuxt-link>
			</li>
		</ul>
	</nav>
</template>

<script setup lang="ts">
	const showAll = ref(false);

	defineProps<{
		page: number
		lastPage: number
	}>();

	const emit = defineEmits(['page']);

	function changePage(page: number) {
		emit('page', page);
	}
</script>
