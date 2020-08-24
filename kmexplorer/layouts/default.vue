<template>
	<div>
		<nav class="navbar is-primary is-fixed-top">
			<div class="navbar-brand">
				<nuxt-link class="navbar-item" to="/">
					<picture>
						<source type="image/webp" :srcset="require('~/assets/nanami.webp')">
						<source type="image/png" :srcset="require('~/assets/nanami.png')">
						<img :src="require('~/assets/nanami.png')" alt="Logo">
					</picture>
					{{ explorerHost }}
				</nuxt-link>
				<div class="navbar-item has-dropdown is-hidden-desktop">
					<a class="navbar-link" @click="openMenu('database')">
						<font-awesome-icon :icon="['fas', 'database']" :fixed-width="true" />
					</a>
				</div>
				<div class="navbar-item has-dropdown is-hidden-desktop">
					<a class="navbar-link" @click="openMenu('community')">
						<font-awesome-icon :icon="['fas', 'cloud-upload-alt']" :fixed-width="true" />
					</a>
				</div>
				<div class="navbar-item has-dropdown is-hidden-desktop">
					<a class="navbar-link" @click="openMenu('account')">
						<font-awesome-icon :icon="['fas', 'user']" :fixed-width="true" />
					</a>
				</div>
			</div>

			<div class="navbar-menu">
				<client-only placeholder="You need to enable JavaScript in order to use search.">
					<search-tags class="navbar-item is-desktop" />
					<div class="navbar-item is-expanded">
						<search-bar />
					</div>
				</client-only>
			</div>

			<div v-if="communityMenu" class="navbar-dropdown">
				<nuxt-link v-if="import_enabled" class="navbar-item" to="/import">
					<font-awesome-icon :icon="['fas', 'file-import']" :fixed-width="true" />
					{{ $t('menu.kara_import') }}
				</nuxt-link>
			</div>

			<div v-if="accountMenu" class="navbar-dropdown">
				<a
					v-if="loggedIn"
					class="navbar-item"
					aria-label="Profile"
					@click.prevent="modal.profile = true"
				>
					<font-awesome-icon :icon="['fas', 'user']" :fixed-width="true" />
					{{ $t('menu.profile') }}
				</a>
				<nuxt-link v-if="loggedIn" to="/favorites" class="navbar-item" active-class="is-active">
					<font-awesome-icon :icon="['fas', 'star']" :fixed-width="true" />
					{{ $t('menu.favorites') }}
				</nuxt-link>
				<a v-else class="navbar-item" aria-label="Login" @click.prevent="modal.auth = true">
					<font-awesome-icon :icon="['fas', 'sign-in-alt']" :fixed-width="true" />
					{{ $t('menu.connection') }}
				</a>
				<a v-if="loggedIn" class="navbar-item" aria-label="Logout" @click.prevent="logout">
					<font-awesome-icon :icon="['fas', 'sign-out-alt']" :fixed-width="true" />
					{{ $t('menu.logout') }}
				</a>
			</div>

			<div v-if="databaseMenu" class="navbar-dropdown">
				<div class="is-hidden-desktop">
					<nuxt-link class="navbar-item" to="/search">
						<font-awesome-icon :icon="['fas', 'music']" :fixed-width="true" />
						{{ $t('menu.karas') }}
					</nuxt-link>
					<nuxt-link class="navbar-item" to="/types/songtypes">
						<font-awesome-icon :icon="['fas', 'list']" :fixed-width="true" />
						{{ $t('menu.songtypes') }}
					</nuxt-link>
					<div class="navbar-item">
						<a :class="tagsMenu && 'is-active'" @click="tagsMenu = !tagsMenu">
							<font-awesome-icon :icon="['fas', 'tags']" :fixed-width="true" />
							{{ $t('menu.tags') }}
						</a>

						<div v-if="tagsMenu" class="navbar-dropdown">
							<nuxt-link class="navbar-item" to="/types/misc">
								<font-awesome-icon :icon="['fas', 'tags']" :fixed-width="true" />
								{{ $t('menu.miscs') }}
							</nuxt-link>

							<nuxt-link class="navbar-item" to="/types/groups">
								<font-awesome-icon :icon="['fas', 'boxes']" :fixed-width="true" />
								{{ $t('menu.groups') }}
							</nuxt-link>

							<nuxt-link class="navbar-item" to="/types/families">
								<font-awesome-icon :icon="['fas', 'photo-video']" :fixed-width="true" />
								{{ $t('menu.families') }}
							</nuxt-link>

							<nuxt-link class="navbar-item" to="/types/origins">
								<font-awesome-icon :icon="['fas', 'project-diagram']" :fixed-width="true" />
								{{ $t('menu.origins') }}
							</nuxt-link>

							<nuxt-link class="navbar-item" to="/types/genres">
								<font-awesome-icon :icon="['fas', 'chess']" :fixed-width="true" />
								{{ $t('menu.genres') }}
							</nuxt-link>

							<nuxt-link class="navbar-item" to="/types/platforms">
								<font-awesome-icon :icon="['fas', 'laptop']" :fixed-width="true" />
								{{ $t('menu.platforms') }}
							</nuxt-link>
						</div>
					</div>
					<nuxt-link class="navbar-item" to="/types/singers">
						<font-awesome-icon :icon="['fas', 'microphone-alt']" :fixed-width="true" />
						{{ $t('menu.singers') }}
					</nuxt-link>
					<nuxt-link class="navbar-item" to="/types/series">
						<font-awesome-icon :icon="['fas', 'tv']" :fixed-width="true" />
						{{ $t('menu.series') }}
					</nuxt-link>
					<nuxt-link class="navbar-item" to="/types/songwriters">
						<font-awesome-icon :icon="['fas', 'signature']" :fixed-width="true" />
						{{ $t('menu.songwriters') }}
					</nuxt-link>
					<nuxt-link class="navbar-item" to="/types/creators">
						<font-awesome-icon :icon="['fas', 'chalkboard-teacher']" :fixed-width="true" />
						{{ $t('menu.creators') }}
					</nuxt-link>
					<nuxt-link class="navbar-item" to="/types/authors">
						<font-awesome-icon :icon="['fas', 'user-secret']" :fixed-width="true" />
						{{ $t('menu.authors') }}
					</nuxt-link>
					<nuxt-link class="navbar-item" to="/types/langs">
						<font-awesome-icon :icon="['fas', 'language']" :fixed-width="true" />
						{{ $t('menu.languages') }}
					</nuxt-link>
					<nuxt-link class="navbar-item" to="/types/years">
						<font-awesome-icon :icon="['fas', 'calendar-alt']" :fixed-width="true" />
						{{ $t('menu.years') }}
					</nuxt-link>
				</div>
			</div>
		</nav>

		<div class="columns">
			<aside class="menu is-hidden-touch">
				<ul class="menu-list">
					<li class="addRepo" :title="$t('modal.add_repository.label')">
						<a @click.prevent="openAddRepoModal">
							<font-awesome-icon :icon="['fas', 'folder-plus']" :fixed-width="true" />
							{{ $t('menu.add_repository') }}
						</a>
					</li>
				</ul>
				<p class="menu-label">
					{{ $t('menu.database') }}
				</p>
				<ul class="menu-list">
					<li>
						<nuxt-link to="/search" active-class="is-active">
							<font-awesome-icon :icon="['fas', 'music']" :fixed-width="true" />
							{{ $t('menu.karas') }}
						</nuxt-link>
					</li>
					<li>
						<nuxt-link
							to="/types/songtypes"
							active-class="is-active"
							:class="{'is-active': tagType === '~3'}"
						>
							<font-awesome-icon :icon="['fas', 'list']" :fixed-width="true" />
							{{ $t('menu.songtypes') }}
						</nuxt-link>
					</li>
					<li>
						<nuxt-link
							to="/types/series"
							active-class="is-active"
							:class="{'is-active': tagType === '~1'}"
						>
							<font-awesome-icon :icon="['fas', 'tv']" :fixed-width="true" />
							{{ $t('menu.series') }}
						</nuxt-link>
					</li>
					<li>
						<a :class="tagsMenu && 'is-active'" @click="tagsMenu = !tagsMenu">
							<font-awesome-icon :icon="['fas', 'tags']" :fixed-width="true" />
							{{ $t('menu.tags') }}
						</a>
						<ul v-if="tagsMenu" class="menu-list">
							<li>
								<nuxt-link
									to="/types/misc"
									active-class="is-active"
									:class="{'is-active': tagType === '~7'}"
								>
									<font-awesome-icon :icon="['fas', 'tags']" :fixed-width="true" />
									{{ $t('menu.miscs') }}
								</nuxt-link>
							</li>
							<li>
								<nuxt-link
									to="/types/groups"
									active-class="is-active"
									:class="{'is-active': tagType === '~9'}"
								>
									<font-awesome-icon :icon="['fas', 'boxes']" :fixed-width="true" />
									{{ $t('menu.groups') }}
								</nuxt-link>
							</li>
							<li>
								<nuxt-link
									to="/types/families"
									active-class="is-active"
									:class="{'is-active': tagType === '~10'}"
								>
									<font-awesome-icon :icon="['fas', 'photo-video']" :fixed-width="true" />
									{{ $t('menu.families') }}
								</nuxt-link>
							</li>
							<li>
								<nuxt-link
									to="/types/origins"
									active-class="is-active"
									:class="{'is-active': tagType === '~11'}"
								>
									<font-awesome-icon :icon="['fas', 'project-diagram']" :fixed-width="true" />
									{{ $t('menu.origins') }}
								</nuxt-link>
							</li>
							<li>
								<nuxt-link
									to="/types/genres"
									active-class="is-active"
									:class="{'is-active': tagType === '~12'}"
								>
									<font-awesome-icon :icon="['fas', 'chess']" :fixed-width="true" />
									{{ $t('menu.genres') }}
								</nuxt-link>
							</li>
							<li>
								<nuxt-link
									to="/types/platforms"
									active-class="is-active"
									:class="{'is-active': tagType === '~13'}"
								>
									<font-awesome-icon :icon="['fas', 'laptop']" :fixed-width="true" />
									{{ $t('menu.platforms') }}
								</nuxt-link>
							</li>
						</ul>
					</li>
					<li>
						<nuxt-link
							to="/types/singers"
							active-class="is-active"
							:class="{'is-active': tagType === '~2'}"
						>
							<font-awesome-icon :icon="['fas', 'microphone-alt']" :fixed-width="true" />
							{{ $t('menu.singers') }}
						</nuxt-link>
					</li>
					<li>
						<nuxt-link
							to="/types/songwriters"
							active-class="is-active"
							:class="{'is-active': tagType === '~8'}"
						>
							<font-awesome-icon :icon="['fas', 'signature']" :fixed-width="true" />
							{{ $t('menu.songwriters') }}
						</nuxt-link>
					</li>
					<li>
						<nuxt-link
							to="/types/creators"
							active-class="is-active"
							:class="{'is-active': tagType === '~4'}"
						>
							<font-awesome-icon :icon="['fas', 'chalkboard-teacher']" :fixed-width="true" />
							{{ $t('menu.creators') }}
						</nuxt-link>
					</li>
					<li>
						<nuxt-link
							to="/types/authors"
							active-class="is-active"
							:class="{'is-active': tagType === '~6'}"
						>
							<font-awesome-icon :icon="['fas', 'user-secret']" :fixed-width="true" />
							{{ $t('menu.authors') }}
						</nuxt-link>
					</li>
					<li>
						<nuxt-link
							to="/types/langs"
							active-class="is-active"
							:class="{'is-active': tagType === '~5'}"
						>
							<font-awesome-icon :icon="['fas', 'language']" :fixed-width="true" />
							{{ $t('menu.languages') }}
						</nuxt-link>
					</li>
					<li>
						<nuxt-link
							to="/types/years"
							active-class="is-active"
							:class="{'is-active': $route.params.year}"
						>
							<font-awesome-icon :icon="['fas', 'calendar-alt']" :fixed-width="true" />
							{{ $t('menu.years') }}
						</nuxt-link>
					</li>
				</ul>
				<p class="menu-label">
					{{ $t('menu.community') }}
				</p>
				<ul class="menu-list">
					<li>
						<nuxt-link v-if="import_enabled" to="/import" active-class="is-active">
							<font-awesome-icon :icon="['fas', 'file-import']" :fixed-width="true" />
							{{ $t('menu.kara_import') }}
						</nuxt-link>
					</li>
				</ul>
				<p class="menu-label">
					{{ $t('menu.account') }}
				</p>
				<ul class="menu-list">
					<li>
						<a v-if="loggedIn" aria-label="Profile" @click.prevent="modal.profile = true">
							<font-awesome-icon :icon="['fas', 'user']" :fixed-width="true" />
							{{ $t('menu.profile') }}
						</a>
						<nuxt-link v-if="loggedIn" to="/favorites" active-class="is-active">
							<font-awesome-icon :icon="['fas', 'star']" :fixed-width="true" />
							{{ $t('menu.favorites') }}
						</nuxt-link>
						<a v-if="loggedIn" aria-label="Logout" @click.prevent="logout">
							<font-awesome-icon :icon="['fas', 'sign-out-alt']" :fixed-width="true" />
							{{ $t('menu.logout') }}
						</a>
						<a v-else aria-label="Login" @click.prevent="modal.auth = true">
							<font-awesome-icon :icon="['fas', 'sign-in-alt']" :fixed-width="true" />
							{{ $t('menu.connection') }}
						</a>
					</li>
				</ul>
			</aside>
			<section class="container column is-fluid">
				<!-- <nuxt keep-alive :keep-alive-props="{ max: 3, exclude: ['KaraSearch'] }" /> -->
				<nuxt />
			</section>
		</div>
		<footer class="footer">
			<div class="columns has-text-centered">
				<p class="column">
					Karaoke Mugen Server -
					<a
						href="https://lab.shelter.moe/karaokemugen/karaokemugen-server"
					>GIT</a> -
					<a href="http://karaokes.moe">{{ $t('footer.home') }}</a>
				</p>
				<p class="column">
					{{ $t('footer.software_under_license') }}
					<a
						href="https://lab.shelter.moe/karaokemugen/karaokemugen-server/blob/master/LICENSE.md"
					>MIT</a>
					<template v-if="base_license_name">
						/ {{ $t('footer.base_under_licence') }}
						<a :href="base_license_link">{{ base_license_name }}</a>
					</template>
				</p>
			</div>
		</footer>
		<LoginModal :active="modal.auth" @close="modal.auth=false" @login="loggedIn=true" />
		<ProfileModal :active="modal.profile" @close="modal.profile=false" @logout="logout" />
		<AddRepoModal :active="modal.addRepo" @close="modal.addRepo=false" />
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import SearchTags from '~/components/SearchTags.vue';
	import SearchBar from '~/components/SearchBar.vue';
	import LoginModal from '~/components/LoginModal.vue';
	import ProfileModal from '~/components/ProfileModal.vue';
	import AddRepoModal from '~/components/AddRepoModal.vue';
	import { modalStore } from '~/store';

	import { ModalType } from '~/store/modal';

	interface VState {
		import_enabled?: string,
		base_license_name?: string,
		base_license_link?: string,
		explorerHost?: string,
		loggedIn: boolean,
		tagsMenu: boolean,
		databaseMenu: boolean,
		communityMenu: boolean,
		accountMenu: boolean,
		modal: {
			auth: boolean,
			profile: boolean,
			addRepo: boolean
		}
	}

	export default Vue.extend({

		components: {
			SearchTags,
			SearchBar,
			LoginModal,
			ProfileModal,
			AddRepoModal
		},

		data(): VState {
			return {
				import_enabled: process.env.KM_IMPORT,
				base_license_name: process.env.BASE_LICENSE_NAME,
				base_license_link: process.env.BASE_LICENSE_LINK,
				explorerHost: process.env.EXPLORER_HOST,
				loggedIn: this.$auth.loggedIn,
				tagsMenu: false,
				databaseMenu: false,
				communityMenu: false,
				accountMenu: false,
				modal: {
					auth: false,
					profile: false,
					addRepo: false
				}
			};
		},

		computed: {
			tagType() {
				return this.$route.params?.id?.substring(36);
			},
			onKaraTagListView(): boolean {
				return ['types-id', 'search-query', 'favorites'].includes(this.$route.name as string);
			}
		},

		created() {
			this.$store.subscribe((mutation: Record<string, any>, _state: any) => {
				if (mutation.type === 'menubar/setSearch') {
					if (!this.onKaraTagListView) {
						this.$router.push(`/search/${mutation.payload}`);
					} // Each KaraList view handles a search change itself, either by swapping the route
					// or by reset the KaraList with new filter
				} else if (mutation.type === 'modal/openModal') {
					this.modal[mutation.payload as ModalType] = true;
				} else if (mutation.type === 'modal/closeModal') {
					this.modal[mutation.payload as ModalType] = false;
				}
			});
		},

		mounted() {
			this.$router.beforeEach((_to: Location, _from: Location, next: Function) => {
				next();
				// Close all the menus after a navigation
				this.accountMenu = false;
				this.databaseMenu = false;
				this.communityMenu = false;
			});
		},

		methods: {
			logout() {
				this.$auth.logout();
				this.loggedIn = false;
			},
			openMenu(menu: string) {
				if (menu === 'database') {
					this.databaseMenu = !this.databaseMenu;
					this.communityMenu = false;
					this.accountMenu = false;
				} else if (menu === 'community') {
					this.databaseMenu = false;
					this.communityMenu = !this.communityMenu;
					this.accountMenu = false;
				} else if (menu === 'account') {
					this.databaseMenu = false;
					this.communityMenu = false;
					this.accountMenu = !this.accountMenu;
				}
			},
			openAddRepoModal() {
				modalStore.openModal('addRepo');
			}
		},

		head() {
			const seo = this.$nuxtI18nSeo();
			if (!Array.isArray(seo.meta)) { seo.meta = []; }
			seo.meta.push({ hid: 'og-url', property: 'og:url', content: `${process.env.BASE_URL}${this.$route.fullPath}` });
			return seo;
		}
	});
</script>
<style scoped lang="scss">
	.menu {
		margin-left: 15px;
		position: fixed;
		overflow-y: auto;
		height: 100%;
	}

	.menu > *:last-child {
		margin-bottom: 5em;
	}

	.addRepo {
		cursor: pointer;
		max-width: 10em;
	}
</style>
