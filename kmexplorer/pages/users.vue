<template>
	<div>
		<div class="tile is-parent is-12 is-hidden-desktop">
			<search-tags />
			<search-bar :filter="false" :results="false" />
			<search-edit />
		</div>
		<div v-for="n in Math.ceil(users.content.length / 2)" :key="n" class="tile is-parent is-12">
			<div v-for="n2 in 2" :key="`${n}_${n2}`" class="tile is-child is-6">
				<user-card v-if="users.content[(n-1)*2+n2-1]" :user="users.content[(n-1)*2+n2-1]" />
			</div>
		</div>
		<loading-nanami v-if="loading" class="tile is-parent is-12" />
		<div v-if="fullyLoaded" class="tile is-parent">
			<div class="tile is-child">
				<div class="box">
					<h4 class="title is-4">
						{{ $t('layout.end_users') }}
					</h4>
				</div>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import { mapState } from 'vuex';
	import { debounce } from 'lodash';
	import UserCard from '~/components/UserCard.vue';
	import { UserList } from '%/types/user';
	import { menuBarStore } from '~/utils/store-accessor';
	import LoadingNanami from '~/components/LoadingNanami.vue';
	import SearchEdit from '~/components/SearchEdit.vue';
	import SearchBar from '~/components/SearchBar.vue';
	import SearchTags from '~/components/SearchTags.vue';

	interface VState {
		users: UserList,
		activated: boolean,
		from: number,
		loading: boolean,
		resetListDebounced?: Function,
		resetNeeded: boolean
	}

	interface UsersRequest {
		filter: string,
		from: number,
		size: number
	}

	export default Vue.extend({
		name: 'UserSearch',

		components: {
			UserCard,
			LoadingNanami,
			SearchTags,
			SearchBar,
			SearchEdit
		},

		data(): VState {
			return {
				users: {
					infos: {
						count: 0,
						from: 0,
						to: 0
					},
					content: []
				},
				activated: false,
				from: -1,
				loading: false,
				resetNeeded: false
			};
		},

		async fetch() {
			if (!process.env.USERS as unknown as boolean) {
				this.$nuxt.error({ statusCode: 404 });
			}
			// Load the first page
			await this.loadNextPage(true);
		},

		computed: {
			reqParams(): Partial<UsersRequest> {
				return {
					filter: this.search || undefined,
					from: (this.from * 12),
					size: 12
				};
			},
			fullyLoaded(): boolean {
				return this.users.infos.to === this.users.infos.count;
			},
			...mapState('menubar', ['search'])
		},

		watch: {
			search() {
				this.resetList();
			}
		},

		beforeCreate() {
			menuBarStore.setSearch('');
		},

		created() {
			this.resetListDebounced = debounce(this.actualResetList, 75);
		},

		activated() {
			this.activate();
		},

		deactivated() {
			this.activated = false;
			window.removeEventListener('scroll', this.scrollEvent);
		},

		methods: {
			async loadNextPage(force: boolean = false) {
				if (!force && (this.users.infos.to === this.users.infos.count || this.loading)) {
					return;
				}
				this.from++;
				this.loading = true;
				const data = await this.$axios.$get<UserList>('/api/users', {
					params: this.reqParams
				});
				this.users.content.push(...data.content);
				this.users.infos.count = data.infos.count;
				menuBarStore.setResultsCount(data.infos.count);
				this.users.infos.to = data.infos.to;
				this.loading = false;
			},
			scrollEvent() {
				const bottomOfWindow = document.documentElement.scrollTop + window.innerHeight > document.documentElement.offsetHeight - 400;

				if (bottomOfWindow) {
					this.loadNextPage();
				}
			},
			activate() {
				this.activated = true;
				window.addEventListener('scroll', this.scrollEvent, { passive: true });
				if (this.resetNeeded) {
					this.resetNeeded = false;
					this.resetList();
				}
			},
			actualResetList() {
				if (!this.activated) {
					this.resetNeeded = true;
					return;
				}
				this.users = { infos: { count: 0, to: 0, from: 0 }, content: [] };
				menuBarStore.setResultsCount(0);
				this.from = -1;
				this.loadNextPage(true);
			},
			resetList() {
				if (this.resetListDebounced) {
					this.resetListDebounced();
				} else {
					this.actualResetList();
				}
			}
		}
	});
</script>
