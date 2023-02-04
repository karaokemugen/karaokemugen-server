<template>
	<div>
		<nav class="navbar is-primary is-fixed-top">
			<div class="navbar-brand">
				<nuxt-link
					class="navbar-item"
					to="/"
				>
					<picture>
						<source
							type="image/webp"
							src="~/assets/nanami.webp"
						>
						<source
							type="image/png"
							src="~/assets/nanami.png"
						>
						<img
							src="~/assets/nanami.png"
							alt="Logo"
						>
					</picture>
					{{ explorerHost }}
				</nuxt-link>
				<div class="navbar-item has-dropdown is-hidden-desktop">
					<nuxt-link
						class="navbar-link"
						@click="openMenu('database')"
					>
						<font-awesome-icon
							:icon="['fas', 'database']"
							:fixed-width="true"
						/>
					</nuxt-link>
				</div>
				<div class="navbar-item has-dropdown is-hidden-desktop">
					<nuxt-link
						class="navbar-link"
						@click="openMenu('community')"
					>
						<font-awesome-icon
							:icon="['fas', 'at']"
							:fixed-width="true"
						/>
					</nuxt-link>
				</div>
				<div class="navbar-item has-dropdown is-hidden-desktop">
					<nuxt-link
						class="navbar-link"
						@click="openMenu('participate')"
					>
						<font-awesome-icon
							:icon="['fas', 'cloud-upload-alt']"
							:fixed-width="true"
						/>
					</nuxt-link>
				</div>
				<div class="navbar-item has-dropdown is-hidden-desktop">
					<nuxt-link
						class="navbar-link"
						@click="openMenu('account')"
					>
						<font-awesome-icon
							:icon="['fas', 'user']"
							:fixed-width="true"
						/>
					</nuxt-link>
				</div>
			</div>

			<div class="navbar-menu">
				<client-only placeholder="You need to enable JavaScript in order to use search.">
					<nuxt-link
						class="launchDice button"
						@click.prevent="openRandomKara"
					>
						<font-awesome-icon
							:icon="['fas', 'dice']"
							:fixed-width="true"
						/>
						{{ $t('menu.random') }}
					</nuxt-link>
					<search-tags class="navbar-item is-desktop" />
					<div class="navbar-item is-expanded">
						<search-bar />
					</div>
				</client-only>
			</div>

			<div
				v-if="menuOpen === 'community'"
				class="navbar-dropdown"
			>
				<nuxt-link
					v-if="loggedIn && user?.roles?.admin"
					class="navbar-item"
					to="/remote"
					@click="closeMenu"
				>
					<font-awesome-icon
						:icon="['fas', 'house-laptop']"
						:fixed-width="true"
					/>
					{{ $t('menu.remotes') }}
				</nuxt-link>
				<nuxt-link
					v-if="usersEnabled"
					class="navbar-item"
					to="/users"
					@click="closeMenu"
				>
					<font-awesome-icon
						:icon="['fas', 'users']"
						:fixed-width="true"
					/>
					{{ $t('menu.search_users') }}
				</nuxt-link>
				<nuxt-link
					v-if="discordLink"
					:href="discordLink"
					class="navbar-item"
					@click="closeMenu"
				>
					<font-awesome-icon
						:icon="['fab', 'discord']"
						:fixed-width="true"
					/>
					{{ $t('menu.discord') }}
				</nuxt-link>
				<nuxt-link
					v-if="discourseLink"
					:href="discourseLink"
					class="navbar-item"
					@click="closeMenu"
				>
					<font-awesome-icon
						:icon="['fab', 'discourse']"
						:fixed-width="true"
					/>
					{{ $t('menu.discourse') }}
				</nuxt-link>
			</div>

			<div
				v-if="menuOpen === 'participate'"
				class="navbar-dropdown"
			>
				<nuxt-link
					v-if="import_enabled"
					class="navbar-item"
					to="/import"
					@click="closeMenu"
				>
					<font-awesome-icon
						:icon="['fas', 'file-import']"
						:fixed-width="true"
					/>
					{{ $t('menu.kara_import') }}
				</nuxt-link>
				<nuxt-link
					v-if="suggestions"
					class="navbar-item"
					to="/suggest"
					@click="closeMenu"
				>
					<font-awesome-icon
						:icon="['fas', 'envelope-circle-check']"
						:fixed-width="true"
					/>
					{{ $t('menu.kara_suggest') }}
				</nuxt-link>
			</div>

			<div
				v-if="menuOpen === 'account'"
				class="navbar-dropdown"
			>
				<nuxt-link
					v-if="loggedIn && user"
					:to="`/user/${user.login}`"
					class="navbar-item"
					active-class="is-active"
					aria-label="Profile"
					@click="closeMenu"
				>
					<font-awesome-icon
						:icon="['fas', 'user']"
						:fixed-width="true"
					/>
					{{ user.nickname }}
				</nuxt-link>
				<nuxt-link
					v-else-if="usersEnabled"
					class="navbar-item"
					aria-label="Login"
					@click.prevent="() => {
						openModal('auth');
						closeMenu();
					}"
				>
					<font-awesome-icon
						:icon="['fas', 'sign-in-alt']"
						:fixed-width="true"
					/>
					{{ $t('menu.connection') }}
				</nuxt-link>
				<nuxt-link
					v-if="loggedIn"
					class="navbar-item"
					aria-label="Logout"
					@click.prevent="() => {
						logout();
						closeMenu();
					}"
				>
					<font-awesome-icon
						:icon="['fas', 'sign-out-alt']"
						:fixed-width="true"
					/>
					{{ $t('menu.logout') }}
				</nuxt-link>
				<div class="navbar-item">
					<nuxt-link
						:class="languagesOpen && 'is-active'"
						@click="() => languagesOpen = !languagesOpen"
					>
						<font-awesome-icon
							:icon="['fas', 'globe']"
							:fixed-width="true"
						/>
						{{ $t('menu.switch_language') }}
					</nuxt-link>

					<div
						v-if="languagesOpen"
						class="navbar-dropdown"
					>
						<nuxt-link
							v-for="availableLocale in availableLocales"
							:key="availableLocale.code"
							class="navbar-item"
							href="#"
							@click.prevent.stop="
								setLocale(availableLocale.code);
								editUser(availableLocale.code);
								closeMenu();"
						>
							{{ availableLocale.name }}
						</nuxt-link>
					</div>
				</div>
			</div>

			<div
				v-if="menuOpen === 'database'"
				class="navbar-dropdown"
			>
				<div class="is-hidden-desktop">
					<nuxt-link
						href="/search"
						class="navbar-item"
						@click.prevent="pushSearch"
					>
						<font-awesome-icon
							:icon="['fas', 'music']"
							:fixed-width="true"
						/>
						{{ $t('menu.karas') }}
					</nuxt-link>
					<nuxt-link
						class="navbar-item"
						to="/types/songtypes"
						@click="closeMenu"
					>
						<font-awesome-icon
							:icon="['fas', 'list']"
							:fixed-width="true"
						/>
						{{ $t('menu.songtypes') }}
					</nuxt-link>
					<div class="navbar-item">
						<nuxt-link
							:class="tagsOpen && 'is-active'"
							@click="tagsOpen = !tagsOpen"
						>
							<font-awesome-icon
								:icon="['fas', 'tags']"
								:fixed-width="true"
							/>
							{{ $t('menu.tags') }}
						</nuxt-link>

						<div
							v-if="tagsOpen"
							class="navbar-dropdown"
						>
							<nuxt-link
								class="navbar-item"
								to="/types/singergroups"
								@click="closeMenu"
							>
								<font-awesome-icon
									:icon="['fas', 'people-group']"
									:fixed-width="true"
								/>
								{{ $t('menu.singergroups') }}
							</nuxt-link>
							<nuxt-link
								class="navbar-item"
								to="/types/misc"
								@click="closeMenu"
							>
								<font-awesome-icon
									:icon="['fas', 'tags']"
									:fixed-width="true"
								/>
								{{ $t('menu.misc') }}
							</nuxt-link>

							<nuxt-link
								class="navbar-item"
								to="/types/warnings"
								@click="closeMenu"
							>
								<font-awesome-icon
									:icon="['fas', 'exclamation-triangle']"
									:fixed-width="true"
								/>
								{{ $t('menu.warnings') }}
							</nuxt-link>

							<nuxt-link
								class="navbar-item"
								to="/types/groups"
								@click="closeMenu"
							>
								<font-awesome-icon
									:icon="['fas', 'boxes']"
									:fixed-width="true"
								/>
								{{ $t('menu.groups') }}
							</nuxt-link>

							<nuxt-link
								class="navbar-item"
								to="/types/families"
								@click="closeMenu"
							>
								<font-awesome-icon
									:icon="['fas', 'photo-video']"
									:fixed-width="true"
								/>
								{{ $t('menu.families') }}
							</nuxt-link>

							<nuxt-link
								class="navbar-item"
								to="/types/origins"
								@click="closeMenu"
							>
								<font-awesome-icon
									:icon="['fas', 'project-diagram']"
									:fixed-width="true"
								/>
								{{ $t('menu.origins') }}
							</nuxt-link>

							<nuxt-link
								class="navbar-item"
								to="/types/genres"
								@click="closeMenu"
							>
								<font-awesome-icon
									:icon="['fas', 'chess']"
									:fixed-width="true"
								/>
								{{ $t('menu.genres') }}
							</nuxt-link>

							<nuxt-link
								class="navbar-item"
								to="/types/platforms"
								@click="closeMenu"
							>
								<font-awesome-icon
									:icon="['fas', 'laptop']"
									:fixed-width="true"
								/>
								{{ $t('menu.platforms') }}
							</nuxt-link>

							<nuxt-link
								class="navbar-item"
								to="/types/versions"
								@click="closeMenu"
							>
								<font-awesome-icon
									:icon="['fas', 'tachometer-alt']"
									:fixed-width="true"
								/>
								{{ $t('menu.versions') }}
							</nuxt-link>

							<nuxt-link
								class="navbar-item"
								to="/types/franchises"
								@click="closeMenu"
							>
								<font-awesome-icon
									:icon="['fas', 'sitemap']"
									:fixed-width="true"
								/>
								{{ $t('menu.franchises') }}
							</nuxt-link>
						</div>
					</div>
					<nuxt-link
						class="navbar-item"
						to="/types/singers"
						@click="closeMenu"
					>
						<font-awesome-icon
							:icon="['fas', 'microphone-alt']"
							:fixed-width="true"
						/>
						{{ $t('menu.singers') }}
					</nuxt-link>
					<nuxt-link
						class="navbar-item"
						to="/types/series"
						@click="closeMenu"
					>
						<font-awesome-icon
							:icon="['fas', 'tv']"
							:fixed-width="true"
						/>
						{{ $t('menu.series') }}
					</nuxt-link>
					<nuxt-link
						class="navbar-item"
						to="/types/songwriters"
						@click="closeMenu"
					>
						<font-awesome-icon
							:icon="['fas', 'signature']"
							:fixed-width="true"
						/>
						{{ $t('menu.songwriters') }}
					</nuxt-link>
					<nuxt-link
						class="navbar-item"
						to="/types/creators"
						@click="closeMenu"
					>
						<font-awesome-icon
							:icon="['fas', 'chalkboard-teacher']"
							:fixed-width="true"
						/>
						{{ $t('menu.creators') }}
					</nuxt-link>
					<nuxt-link
						class="navbar-item"
						to="/types/authors"
						@click="closeMenu"
					>
						<font-awesome-icon
							:icon="['fas', 'user-secret']"
							:fixed-width="true"
						/>
						{{ $t('menu.authors') }}
					</nuxt-link>
					<nuxt-link
						class="navbar-item"
						to="/types/langs"
						@click="closeMenu"
					>
						<font-awesome-icon
							:icon="['fas', 'language']"
							:fixed-width="true"
						/>
						{{ $t('menu.langs') }}
					</nuxt-link>
					<nuxt-link
						class="navbar-item"
						to="/types/years"
						@click="closeMenu"
					>
						<font-awesome-icon
							:icon="['fas', 'calendar-alt']"
							:fixed-width="true"
						/>
						{{ $t('menu.years') }}
					</nuxt-link>
				</div>
			</div>
		</nav>

		<div class="columns">
			<aside class="menu is-hidden-touch">
				<ul class="menu-list">
					<li
						v-if="addRepoModalInMenu"
						class="addRepo"
						:title="$t('modal.add_repository.label')"
					>
						<nuxt-link @click.prevent="() => openModal('addRepo')">
							<font-awesome-icon
								:icon="['fas', 'folder-plus']"
								:fixed-width="true"
							/>
							{{ $t('menu.add_repository') }}
						</nuxt-link>
					</li>
				</ul>
				<p class="menu-label">
					{{ $t('menu.database') }}
				</p>
				<ul class="menu-list">
					<li>
						<nuxt-link
							href="/search"
							:class="{'is-active': $route.name === 'search-query'}"
							@click.prevent="pushSearch"
						>
							<font-awesome-icon
								:icon="['fas', 'music']"
								:fixed-width="true"
							/>
							{{ $t('menu.karas') }}
						</nuxt-link>
					</li>
					<li>
						<nuxt-link
							to="/types/songtypes"
							active-class="is-active"
							:class="{'is-active': tagType === '~3'}"
						>
							<font-awesome-icon
								:icon="['fas', 'list']"
								:fixed-width="true"
							/>
							{{ $t('menu.songtypes') }}
						</nuxt-link>
					</li>
					<li>
						<nuxt-link
							to="/types/series"
							active-class="is-active"
							:class="{'is-active': tagType === '~1'}"
						>
							<font-awesome-icon
								:icon="['fas', 'tv']"
								:fixed-width="true"
							/>
							{{ $t('menu.series') }}
						</nuxt-link>
					</li>
					<li>
						<nuxt-link
							:class="tagsOpen && 'is-active'"
							@click="tagsOpen = !tagsOpen"
						>
							<font-awesome-icon
								:icon="['fas', 'tags']"
								:fixed-width="true"
							/>
							{{ $t('menu.tags') }}
						</nuxt-link>
						<ul
							v-if="tagsOpen"
							class="menu-list"
						>
							<li>
								<nuxt-link
									to="/types/singergroups"
									active-class="is-active"
									:class="{'is-active': tagType === '~17'}"
								>
									<font-awesome-icon
										:icon="['fas', 'people-group']"
										:fixed-width="true"
									/>
									{{ $t('menu.singergroups') }}
								</nuxt-link>
							</li>
							<li>
								<nuxt-link
									to="/types/misc"
									active-class="is-active"
									:class="{'is-active': tagType === '~7'}"
								>
									<font-awesome-icon
										:icon="['fas', 'tags']"
										:fixed-width="true"
									/>
									{{ $t('menu.misc') }}
								</nuxt-link>
							</li>
							<li>
								<nuxt-link
									to="/types/warnings"
									active-class="is-active"
									:class="{'is-active': tagType === '~15'}"
								>
									<font-awesome-icon
										:icon="['fas', 'exclamation-triangle']"
										:fixed-width="true"
									/>
									{{ $t('menu.warnings') }}
								</nuxt-link>
							</li>
							<li>
								<nuxt-link
									to="/types/groups"
									active-class="is-active"
									:class="{'is-active': tagType === '~9'}"
								>
									<font-awesome-icon
										:icon="['fas', 'boxes']"
										:fixed-width="true"
									/>
									{{ $t('menu.groups') }}
								</nuxt-link>
							</li>
							<li>
								<nuxt-link
									to="/types/families"
									active-class="is-active"
									:class="{'is-active': tagType === '~10'}"
								>
									<font-awesome-icon
										:icon="['fas', 'photo-video']"
										:fixed-width="true"
									/>
									{{ $t('menu.families') }}
								</nuxt-link>
							</li>
							<li>
								<nuxt-link
									to="/types/origins"
									active-class="is-active"
									:class="{'is-active': tagType === '~11'}"
								>
									<font-awesome-icon
										:icon="['fas', 'project-diagram']"
										:fixed-width="true"
									/>
									{{ $t('menu.origins') }}
								</nuxt-link>
							</li>
							<li>
								<nuxt-link
									to="/types/genres"
									active-class="is-active"
									:class="{'is-active': tagType === '~12'}"
								>
									<font-awesome-icon
										:icon="['fas', 'chess']"
										:fixed-width="true"
									/>
									{{ $t('menu.genres') }}
								</nuxt-link>
							</li>
							<li>
								<nuxt-link
									to="/types/platforms"
									active-class="is-active"
									:class="{'is-active': tagType === '~13'}"
								>
									<font-awesome-icon
										:icon="['fas', 'laptop']"
										:fixed-width="true"
									/>
									{{ $t('menu.platforms') }}
								</nuxt-link>
							</li>
							<li>
								<nuxt-link
									to="/types/versions"
									active-class="is-active"
									:class="{'is-active': tagType === '~14'}"
								>
									<font-awesome-icon
										:icon="['fas', 'tachometer-alt']"
										:fixed-width="true"
									/>
									{{ $t('menu.versions') }}
								</nuxt-link>
							</li>
							<li>
								<nuxt-link
									to="/types/franchises"
									active-class="is-active"
									:class="{'is-active': tagType === '~18'}"
								>
									<font-awesome-icon
										:icon="['fas', 'sitemap']"
										:fixed-width="true"
									/>
									{{ $t('menu.franchises') }}
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
							<font-awesome-icon
								:icon="['fas', 'microphone-alt']"
								:fixed-width="true"
							/>
							{{ $t('menu.singers') }}
						</nuxt-link>
					</li>
					<li>
						<nuxt-link
							to="/types/songwriters"
							active-class="is-active"
							:class="{'is-active': tagType === '~8'}"
						>
							<font-awesome-icon
								:icon="['fas', 'signature']"
								:fixed-width="true"
							/>
							{{ $t('menu.songwriters') }}
						</nuxt-link>
					</li>
					<li>
						<nuxt-link
							to="/types/creators"
							active-class="is-active"
							:class="{'is-active': tagType === '~4'}"
						>
							<font-awesome-icon
								:icon="['fas', 'chalkboard-teacher']"
								:fixed-width="true"
							/>
							{{ $t('menu.creators') }}
						</nuxt-link>
					</li>
					<li>
						<nuxt-link
							to="/types/authors"
							active-class="is-active"
							:class="{'is-active': tagType === '~6'}"
						>
							<font-awesome-icon
								:icon="['fas', 'user-secret']"
								:fixed-width="true"
							/>
							{{ $t('menu.authors') }}
						</nuxt-link>
					</li>
					<li>
						<nuxt-link
							to="/types/langs"
							active-class="is-active"
							:class="{'is-active': tagType === '~5'}"
						>
							<font-awesome-icon
								:icon="['fas', 'language']"
								:fixed-width="true"
							/>
							{{ $t('menu.langs') }}
						</nuxt-link>
					</li>
					<li>
						<nuxt-link
							to="/types/years"
							active-class="is-active"
							:class="{'is-active': $route.params.year}"
						>
							<font-awesome-icon
								:icon="['fas', 'calendar-alt']"
								:fixed-width="true"
							/>
							{{ $t('menu.years') }}
						</nuxt-link>
					</li>
				</ul>
				<p class="menu-label">
					{{ $t('menu.community') }}
				</p>
				<ul class="menu-list">
					<li>
						<nuxt-link
							v-if="loggedIn && user?.roles?.admin"
							to="/remote"
							active-class="is-active"
						>
							<font-awesome-icon
								:icon="['fas', 'house-laptop']"
								:fixed-width="true"
							/>
							{{ $t('menu.remotes') }}
						</nuxt-link>
						<nuxt-link
							v-if="usersEnabled"
							to="/users"
							active-class="is-active"
						>
							<font-awesome-icon
								:icon="['fas', 'users']"
								:fixed-width="true"
							/>
							{{ $t('menu.search_users') }}
						</nuxt-link>
						<nuxt-link
							v-if="discordLink"
							:href="discordLink"
							active-class="is-active"
						>
							<font-awesome-icon
								:icon="['fab', 'discord']"
								:fixed-width="true"
							/>
							{{ $t('menu.discord') }}
						</nuxt-link>
						<nuxt-link
							v-if="discourseLink"
							:href="discourseLink"
							active-class="is-active"
						>
							<font-awesome-icon
								:icon="['fab', 'discourse']"
								:fixed-width="true"
							/>
							{{ $t('menu.discourse') }}
						</nuxt-link>
					</li>
				</ul>
				<p class="menu-label">
					{{ $t('menu.participate') }}
				</p>
				<ul class="menu-list">
					<li>
						<nuxt-link
							v-if="import_enabled"
							to="/import"
							active-class="is-active"
						>
							<font-awesome-icon
								:icon="['fas', 'file-import']"
								:fixed-width="true"
							/>
							{{ $t('menu.kara_import') }}
						</nuxt-link>
					</li>
					<li>
						<nuxt-link
							v-if="suggestions"
							to="/suggest"
							active-class="is-active"
						>
							<font-awesome-icon
								:icon="['fas', 'envelope-circle-check']"
								:fixed-width="true"
							/>
							{{ $t('menu.kara_suggest') }}
						</nuxt-link>
					</li>
				</ul>
				<client-only>
					<p class="menu-label">
						{{ $t('menu.account') }}
					</p>
					<ul class="menu-list">
						<li>
							<nuxt-link
								v-if="loggedIn && user"
								:to="`/user/${user.login}`"
								active-class="is-active"
								aria-label="Profile"
							>
								<font-awesome-icon
									:icon="['fas', 'user']"
									:fixed-width="true"
								/>
								{{ user.nickname }}
							</nuxt-link>
							<nuxt-link
								v-if="loggedIn"
								aria-label="Logout"
								@click.prevent="logout"
							>
								<font-awesome-icon
									:icon="['fas', 'sign-out-alt']"
									:fixed-width="true"
								/>
								{{ $t('menu.logout') }}
							</nuxt-link>
							<nuxt-link
								v-else
								aria-label="Login"
								@click.prevent="() => openModal('auth')"
							>
								<font-awesome-icon
									:icon="['fas', 'sign-in-alt']"
									:fixed-width="true"
								/>
								{{ $t('menu.connection') }}
							</nuxt-link>
							<nuxt-link
								:class="menuOpen === 'language' && 'is-active'"
								@click="openMenu('language')"
							>
								<font-awesome-icon
									:icon="['fas', 'globe']"
									:fixed-width="true"
								/>
								{{ $t('menu.switch_language') }}
							</nuxt-link>
							<ul
								v-if="menuOpen === 'language'"
								class="menu-list"
							>
								<li
									v-for="availableLocale in availableLocales"
									:key="availableLocale.code"
								>
									<nuxt-link
										href="#"
										@click.prevent.stop="() => setUsedLocale(availableLocale.code)"
									>
										{{ availableLocale.name }}
									</nuxt-link>
								</li>
							</ul>
						</li>
					</ul>
				</client-only>
			</aside>
			<section class="container column is-fluid main">
				<NuxtPage />
			</section>
		</div>
		<footer class="footer">
			<div class="columns has-text-centered">
				<p class="column">
					Karaoke Mugen Server -
					<nuxt-link
						href="https://api.karaokes.moe/server"
					>
						{{ $t('footer.api_documentation') }}
					</nuxt-link> -
					<nuxt-link
						href="https://gitlab.com/karaokemugen/code/karaokemugen-server"
					>
						GIT
					</nuxt-link> -
					<nuxt-link href="https://hosted.weblate.org/projects/karaoke-mugen/">
						{{ $t('footer.translation') }}
					</nuxt-link> -
					<nuxt-link href="http://karaokes.moe">
						{{ $t('footer.home') }}
					</nuxt-link>
				</p>
				<p class="column">
					{{ $t('footer.software_under_license') }}
					<nuxt-link
						href="https://gitlab.com/karaokemugen/code/karaokemugen-server/-/blob/master/LICENSE.md"
					>
						MIT
					</nuxt-link>
					<template v-if="base_license_name">
						/ {{ $t('footer.base_under_licence') }}
						<nuxt-link :href="base_license_link">
							{{ base_license_name }}
						</nuxt-link>
					</template>
				</p>
			</div>
		</footer>
		<LoginModal
			:active="auth"
			@close="auth=false"
			@login="login"
		/>
		<ProfileModal
			:active="profile"
			@close="profile=false"
			@logout="logout"
		/>
		<AddRepoModal
			:active="addRepo"
			@close="addRepo=false"
		/>
		<DeleteAccountModal
			:active="deleteAccount"
			@close="deleteAccount=false"
			@logout="logout"
		/>
		<JoinKaraModal
			:active="joinKara"
			@close="joinKara=false"
		/>
		<StatsModal
			:active="stats"
			@close="stats=false"
		/>
	</div>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import { KaraList as KaraListType } from '%/lib/types/kara';
	import slug from 'slug';
	import { LocaleObject } from 'vue-i18n-routing';
	import { useAuthStore } from '~/store/auth';
	import { useLocalStorageStore } from '~/store/localStorage';
	import { useMenubarStore } from '~/store/menubar';
	import { useModalStore } from '~/store/modal';
	import { TokenResponseWithRoles } from '~/../kmserver-core/src/lib/types/user';

	const conf = useRuntimeConfig();
	const import_enabled = conf.public.KM_IMPORT;
	const base_license_name = conf.public.BASE_LICENSE_NAME;
	const base_license_link = conf.public.BASE_LICENSE_LINK;
	const explorerProtocol = conf.public.EXPLORER_PROTOCOL;
	const explorerHost = conf.public.EXPLORER_HOST;
	const discordLink = conf.public.DISCORD_LINK;
	const discourseLink = conf.public.DISCOURSE_LINK;
	const usersEnabled = conf.public.USERS;
	const suggestions = conf.public.SUGGESTIONS;
	const addRepoModalInMenu = conf.public.ADD_REPO_MODAL_IN_MENU;

	type TypeMenu = 'community'|'participate'|'account'|'language'|'database';

	const menuOpen = ref<TypeMenu>();
	const tagsOpen = ref(false);
	const languagesOpen = ref(false);

	const { params, fullPath, name } = useRoute();
	const { beforeEach, push } = useRouter();
	const { locale, locales, setLocale } = useI18n();

	const { $onAction } = useMenubarStore();
	const { auth, joinKara, stats, deleteAccount, addRepo, profile } = storeToRefs(useModalStore());
	const { closeAll, openModal } = useModalStore();
	const { loggedIn, user } = storeToRefs(useAuthStore());
	const { logout, login:loginApi } = useAuthStore();
	const { enabledCollections } = storeToRefs(useLocalStorageStore());


	useHead(() => {
		const seo = useLocaleHead({ addDirAttribute: true, addSeoAttributes: true });
		if (!Array.isArray(seo.value.meta)) { seo.value.meta = []; }
		seo.value.meta.push({ hid: 'og:url', property: 'og:url', content: `${explorerProtocol}://${explorerHost}/${fullPath}` });
		return {
			...seo.value,
			titleTemplate: (titleChunk) => {
				// If undefined or blank then we don't need the hyphen
				return titleChunk ? `${titleChunk} - Karaoke Mugen` : 'Karaoke Mugen';
			}
		};
	});
	
	const tagType = computed(() => params?.id && (params?.id as string).substring(36));
	const onKaraTagUserListView = computed(() => ['types-id', 'search-query', 'user-login', 'users', 'suggest'].includes(name as string));
	const availableLocales = computed(() => locales.value?.filter((i: LocaleObject) => i.code && i.code !== locale.value));

	onMounted(() => {
		$onAction(callback => {
			callback.after(() => {
				if (callback.name === 'setSearch') {
					if (!onKaraTagUserListView) {
						push(generateNavigation());
					} // Each KaraList view handles a search change itself, either by swapping the route
					// or by reset the List with new filter
				}
			});
		});

		beforeEach((_to: any, _from: any, next: Function) => {
			next();
			// Close all the menus after a navigation
			closeAll();
		});
		checkAuth();
	});

	async function checkAuth() {
		useCustomFetch<TokenResponseWithRoles>('/api/auth/check').then(res => loginApi(res)).catch(e => logout());
	}

	function login() {
		if (user?.value?.flag_sendstats === null) {
			openModal('stats');
		}
	}

	function openMenu(menu: TypeMenu) {
		menuOpen.value === menu ? menuOpen.value = undefined : menuOpen.value = menu;
	}
	function closeMenu() {
		menuOpen.value = undefined;
	}

	async function openRandomKara() {
		const res = await useCustomFetch<KaraListType>('/api/karas/search', {
			params: {
				random: 1,
				collections: enabledCollections.value.join(',')
			}
		});
		const kid = res.content[0].kid;
		const slugTitle = slug(res.content[0].titles[res.content[0].titles_default_language || 'eng']);
		push(`/kara/${slugTitle}/${kid}`);
	}
	function pushSearch() {
		if (name !== 'search-query') {
			push(generateNavigation());
		}
		closeMenu();
	}
	function editUser(language: string) {
		if (user?.value) {
			const userEdited = { ...user?.value };
			userEdited.language = language;
			useCustomFetch('/api/myaccount', {
				method: 'PATCH',
				body: userEdited
			});
		}
	}

	function setUsedLocale(availableLocale : string){
		setLocale(availableLocale);
		editUser(availableLocale);
	}
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

	.addRepo, .launchDice {
		cursor: pointer;
		max-width: 10em;
	}
	.launchDice {
		margin: 0.75em;
	}
</style>
