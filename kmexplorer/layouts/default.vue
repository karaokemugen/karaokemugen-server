<template>
	<div>
		<nav class="navbar is-primary is-fixed-top">
			<div class="navbar-brand">
				<nuxt-link class="navbar-item" to="/" @click.native="resetSearch">
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
				<a :aria-label="$t('menu.join_kara')" class="navbar-item" @click.prevent="modal.joinKara = true">
					<font-awesome-icon :icon="['fas', 'person-booth']" :fixed-width="true" />
					{{ $t('menu.join_kara') }}
				</a>
				<nuxt-link v-if="usersEnabled" class="navbar-item" to="/users">
					<font-awesome-icon :icon="['fas', 'users']" :fixed-width="true" />
					{{ $t('menu.search_users') }}
				</nuxt-link>
				<nuxt-link v-if="import_enabled" class="navbar-item" to="/import">
					<font-awesome-icon :icon="['fas', 'file-import']" :fixed-width="true" />
					{{ $t('menu.kara_import') }}
				</nuxt-link>
			</div>

			<div v-if="accountMenu" class="navbar-dropdown">
				<nuxt-link
					v-if="loggedIn && user"
					:to="`/user/${user.login}`"
					class="navbar-item"
					active-class="is-active"
					aria-label="Profile"
				>
					<font-awesome-icon :icon="['fas', 'user']" :fixed-width="true" />
					{{ user.nickname }}
				</nuxt-link>
				<a
					v-if="loggedIn"
					class="navbar-item"
					aria-label="Edit profile"
					@click.prevent="modal.profile = true"
				>
					<font-awesome-icon :icon="['fas', 'edit']" :fixed-width="true" />
					{{ $t('menu.profile') }}
				</a>
				<a v-else-if="usersEnabled" class="navbar-item" aria-label="Login" @click.prevent="modal.auth = true">
					<font-awesome-icon :icon="['fas', 'sign-in-alt']" :fixed-width="true" />
					{{ $t('menu.connection') }}
				</a>
				<a v-if="loggedIn" class="navbar-item" aria-label="Logout" @click.prevent="logout">
					<font-awesome-icon :icon="['fas', 'sign-out-alt']" :fixed-width="true" />
					{{ $t('menu.logout') }}
				</a>
				<div class="navbar-item">
					<a :class="languageMenu && 'is-active'" @click="languageMenu = !languageMenu">
						<font-awesome-icon :icon="['fas', 'globe']" :fixed-width="true" />
						{{ $t('menu.switch_language') }}
					</a>

					<div v-if="languageMenu" class="navbar-dropdown">
						<a
							v-for="locale in availableLocales"
							:key="locale.code"
							class="navbar-item"
							href="#"
							@click.prevent.stop="
								$i18n.setLocale(locale.code);
								editUser(locale.code);
								languageMenu = !languageMenu;
								accountMenu = !accountMenu;"
						>
							{{ locale.name }}
						</a>
					</div>
				</div>
			</div>

			<div v-if="databaseMenu" class="navbar-dropdown">
				<div class="is-hidden-desktop">
					<a class="navbar-item" @click.prevent="openRandomKara">
						<font-awesome-icon :icon="['fas', 'dice']" :fixed-width="true" />
						{{ $t('menu.random') }}
					</a>
					<a href="/search" class="navbar-item" @click.prevent="pushSearch">
						<font-awesome-icon :icon="['fas', 'music']" :fixed-width="true" />
						{{ $t('menu.karas') }}
					</a>
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
								{{ $t('menu.misc') }}
							</nuxt-link>

							<nuxt-link class="navbar-item" to="/types/warnings">
								<font-awesome-icon :icon="['fas', 'exclamation-triangle']" :fixed-width="true" />
								{{ $t('menu.warnings') }}
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

							<nuxt-link class="navbar-item" to="/types/versions">
								<font-awesome-icon :icon="['fas', 'tachometer-alt']" :fixed-width="true" />
								{{ $t('menu.versions') }}
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
						{{ $t('menu.langs') }}
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
					<li class="addRepo">
						<a @click.prevent="openRandomKara">
							<font-awesome-icon :icon="['fas', 'dice']" :fixed-width="true" />
							{{ $t('menu.random') }}
						</a>
					</li>
				</ul>
				<p class="menu-label">
					{{ $t('menu.database') }}
				</p>
				<ul class="menu-list">
					<li>
						<a href="/search" :class="{'is-active': $route.name === 'search-query'}" @click.prevent="pushSearch">
							<font-awesome-icon :icon="['fas', 'music']" :fixed-width="true" />
							{{ $t('menu.karas') }}
						</a>
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
									{{ $t('menu.misc') }}
								</nuxt-link>
							</li>
							<li>
								<nuxt-link
									to="/types/warnings"
									active-class="is-active"
									:class="{'is-active': tagType === '~15'}"
								>
									<font-awesome-icon :icon="['fas', 'exclamation-triangle']" :fixed-width="true" />
									{{ $t('menu.warnings') }}
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
							<li>
								<nuxt-link
									to="/types/versions"
									active-class="is-active"
									:class="{'is-active': tagType === '~14'}"
								>
									<font-awesome-icon :icon="['fas', 'tachometer-alt']" :fixed-width="true" />
									{{ $t('menu.versions') }}
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
							{{ $t('menu.langs') }}
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
						<a aria-label="Join a karaoke party" @click.prevent="modal.joinKara = true">
							<font-awesome-icon :icon="['fas', 'person-booth']" :fixed-width="true" />
							{{ $t('menu.join_kara') }}
						</a>
						<nuxt-link to="/users" active-class="is-active">
							<font-awesome-icon :icon="['fas', 'users']" :fixed-width="true" />
							{{ $t('menu.search_users') }}
						</nuxt-link>
						<nuxt-link v-if="import_enabled" to="/import" active-class="is-active">
							<font-awesome-icon :icon="['fas', 'file-import']" :fixed-width="true" />
							{{ $t('menu.kara_import') }}
						</nuxt-link>
					</li>
				</ul>
				<client-only>
					<p class="menu-label">
						{{ $t('menu.account') }}
					</p>
					<ul class="menu-list">
						<li>
							<nuxt-link v-if="loggedIn && user" :to="`/user/${user.login}`" active-class="is-active" aria-label="Profile">
								<font-awesome-icon :icon="['fas', 'user']" :fixed-width="true" />
								{{ user.nickname }}
							</nuxt-link>
							<a v-if="loggedIn" aria-label="Edit profile" @click.prevent="modal.profile = true">
								<font-awesome-icon :icon="['fas', 'edit']" :fixed-width="true" />
								{{ $t('menu.profile') }}
							</a>
							<a v-if="loggedIn" aria-label="Logout" @click.prevent="logout">
								<font-awesome-icon :icon="['fas', 'sign-out-alt']" :fixed-width="true" />
								{{ $t('menu.logout') }}
							</a>
							<a v-else aria-label="Login" @click.prevent="modal.auth = true">
								<font-awesome-icon :icon="['fas', 'sign-in-alt']" :fixed-width="true" />
								{{ $t('menu.connection') }}
							</a>
							<a :class="languageMenu && 'is-active'" @click="languageMenu = !languageMenu">
								<font-awesome-icon :icon="['fas', 'globe']" :fixed-width="true" />
								{{ $t('menu.switch_language') }}
							</a>
							<ul v-if="languageMenu" class="menu-list">
								<li v-for="locale in availableLocales" :key="locale.code">
									<a
										href="#"
										@click.prevent.stop="
											$i18n.setLocale(locale.code);
											editUser(locale.code);
										"
									>{{ locale.name }}</a>
								</li>
							</ul>
						</li>
					</ul>
				</client-only>
			</aside>
			<section class="container column is-fluid main">
				<nuxt keep-alive :keep-alive-props="{ max: 1, include: ['KaraSearch', 'UserView', 'UserSearch'] }" />
			</section>
		</div>
		<footer class="footer">
			<div class="columns has-text-centered">
				<p class="column">
					Karaoke Mugen Server -
					<a
						href="https://gitlab.com/karaokemugen/karaokemugen-server"
					>GIT</a> -
					<a href="https://hosted.weblate.org/projects/karaoke-mugen/">{{ $t('footer.translation') }}</a> -
					<a href="http://karaokes.moe">{{ $t('footer.home') }}</a>
				</p>
				<p class="column">
					{{ $t('footer.software_under_license') }}
					<a
						href="https://gitlab.com/karaokemugen/karaokemugen-server/-/blob/master/LICENSE.md"
					>MIT</a>
					<template v-if="base_license_name">
						/ {{ $t('footer.base_under_licence') }}
						<a :href="base_license_link">{{ base_license_name }}</a>
					</template>
				</p>
			</div>
		</footer>
		<LoginModal :active="modal.auth" @close="modal.auth=false" @login="login" />
		<ProfileModal :active="modal.profile" @close="modal.profile=false" @logout="logout" />
		<AddRepoModal :active="modal.addRepo" @close="modal.addRepo=false" />
		<DeleteAccountModal :active="modal.deleteAccount" @close="modal.deleteAccount=false" @logout="logout" />
		<JoinKaraModal :active="modal.joinKara" @close="modal.joinKara=false" />
		<StatsModal :active="modal.stats" @close="modal.stats=false" />
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import { mapState } from 'vuex';
	import VueI18n from 'vue-i18n';
	import SearchTags from '~/components/SearchTags.vue';
	import SearchBar from '~/components/SearchBar.vue';
	import LoginModal from '~/components/modals/LoginModal.vue';
	import ProfileModal from '~/components/modals/ProfileModal.vue';
	import AddRepoModal from '~/components/modals/AddRepoModal.vue';
	import DeleteAccountModal from '~/components/modals/DeleteAccountModal.vue';
	import JoinKaraModal from '~/components/modals/JoinKaraModal.vue';
	import StatsModal from '~/components/modals/StatsModal.vue';
	import { menuBarStore, modalStore } from '~/store';
	import { generateNavigation } from '~/utils/tools';
	import { ModalType } from '~/store/modal';
	import { DBUser } from '~/../kmserver-core/src/lib/types/database/user';

	interface VState {
		import_enabled?: string,
		base_license_name?: string,
		base_license_link?: string,
		explorerHost?: string,
		usersEnabled?: boolean,
		tagsMenu: boolean,
		databaseMenu: boolean,
		communityMenu: boolean,
		accountMenu: boolean,
		languageMenu: boolean,
		modal: {
			auth: boolean,
			profile: boolean,
			addRepo: boolean,
			deleteAccount: boolean,
			joinKara: boolean,
			stats: boolean
		}
	}

	export default Vue.extend({

		components: {
			SearchTags,
			SearchBar,
			LoginModal,
			ProfileModal,
			AddRepoModal,
			DeleteAccountModal,
			JoinKaraModal,
			StatsModal
		},

		data(): VState {
			return {
				import_enabled: process.env.KM_IMPORT,
				base_license_name: process.env.BASE_LICENSE_NAME,
				base_license_link: process.env.BASE_LICENSE_LINK,
				explorerHost: process.env.EXPLORER_HOST,
				usersEnabled: process.env.USERS as unknown as boolean,
				tagsMenu: false,
				databaseMenu: false,
				communityMenu: false,
				accountMenu: false,
				languageMenu: false,
				modal: {
					auth: false,
					profile: false,
					addRepo: false,
					deleteAccount: false,
					joinKara: false,
					stats: false
				}
			};
		},

		head() {
			const seo = this.$nuxtI18nHead({ addDirAttribute: true, addSeoAttributes: true });
			if (!Array.isArray(seo.meta)) { seo.meta = []; }
			seo.meta.push({ hid: 'og:url', property: 'og:url', content: `${process.env.BASE_URL}${this.$route.fullPath}` });
			return seo;
		},

		computed: {
			tagType() {
				return this.$route.params?.id?.substring(36);
			},
			onKaraTagUserListView(): boolean {
				return ['types-id', 'search-query', 'user-login', 'users'].includes(this.$route.name as string);
			},
			availableLocales(): VueI18n.Locale[] {
				return this.$i18n.locales?.filter((i: any) => i.code && i.code !== this.$i18n.locale);
			},
			...mapState('auth', ['loggedIn', 'user'])
		},

		created() {
			this.$store.subscribe((mutation: Record<string, any>, _state: any) => {
				if (mutation.type === 'menubar/setSearch') {
					if (!this.onKaraTagUserListView) {
						this.$router.push(generateNavigation(menuBarStore));
					} // Each KaraList view handles a search change itself, either by swapping the route
					// or by reset the List with new filter
				} else if (mutation.type === 'modal/openModal') {
					this.modal[mutation.payload as ModalType] = true;
				} else if (mutation.type === 'modal/closeModal') {
					this.modal[mutation.payload as ModalType] = false;
				}
			});
			if (this.$auth.loggedIn && (this.$store.state.auth.user as unknown as DBUser).flag_sendstats === null) {
				this.modal.stats = true;
			}
		},

		mounted() {
			this.$router.beforeEach((_to: Location, _from: Location, next: Function) => {
				next();
				// Close all the menus after a navigation
				this.accountMenu = false;
				this.databaseMenu = false;
				this.communityMenu = false;
				this.languageMenu = false;
			});
		},

		methods: {
			login() {
				if ((this.$store.state.auth.user as unknown as DBUser).flag_sendstats === null) {
					this.modal.stats = true;
				}
			},
			logout() {
				this.$auth.logout();
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
			},
			async openRandomKara() {
				const res = await this.$axios.get('/api/karas/random', { params: { size: 1 } });
				const kid = res.data[0];
				this.$router.push(`/kara/${kid}`);
			},
			resetSearch() {
				menuBarStore.reset();
			},
			pushSearch() {
				if (this.$route.name !== 'search-query') {
					this.$router.push(generateNavigation(menuBarStore));
				}
			},
			editUser(language: string) {
				const storeUser = this.$store.state.auth.user as unknown as DBUser;
				if (storeUser) {
					const user = { ...storeUser };
					user.language = language;
					this.$axios.put('/api/myaccount', user);
				}
			}
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
