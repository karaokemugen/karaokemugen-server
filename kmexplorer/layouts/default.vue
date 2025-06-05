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
					{{ url.hostname }}
				</nuxt-link>
				<div
					class="navbar-item is-hidden-desktop"
					@click.prevent="openRandomKara"
				>
					<font-awesome-icon
						:icon="['fas', 'dice']"
						:fixed-width="true"
					/>
				</div>
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
					<search-tags
						v-if="$route.name !== 'suggest'"
						class="navbar-item is-desktop"
					/>
					<search-languages
						v-if="$route.name === 'suggest'"
						class="navbar-item is-desktop"
					/>
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
					v-if="config?.Users.Enabled"
					class="navbar-item"
					to="/playlists"
					@click="closeMenu"
				>
					<font-awesome-icon
						:icon="['fas', 'list']"
						:fixed-width="true"
					/>
					{{ $t('menu.playlists') }}
				</nuxt-link>
				<client-only>
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
				</client-only>
				<nuxt-link
					v-if="config?.Users.Enabled"
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
				<client-only>
					<nuxt-link
						v-if="loggedIn && user?.roles?.admin"
						class="navbar-item"
						to="/bans"
						@click="closeMenu"
					>
						<font-awesome-icon
							:icon="['fas', 'ban']"
							:fixed-width="true"
						/>
						{{ $t('menu.bans') }}
					</nuxt-link>
				</client-only>
				<nuxt-link
					v-if="config?.Frontend.DiscordURL"
					:href="config?.Frontend.DiscordURL"
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
					v-if="config?.Frontend.DiscourseURL"
					:href="config?.Frontend.DiscourseURL"
					class="navbar-item"
					@click="closeMenu"
				>
					<font-awesome-icon
						:icon="['fab', 'discourse']"
						:fixed-width="true"
					/>
					{{ $t('menu.discourse') }}
				</nuxt-link>
				<nuxt-link
					v-if="config?.Frontend.Import"
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
					v-if="config?.Frontend.Suggestions"
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

			<client-only>
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
						v-if="loggedIn && user && user.anime_list_to_fetch"
						:to="`/user/${user.login}/animelist`"
						class="navbar-item"
						active-class="is-active"
						aria-label="My animes"
						@click="closeMenu"
					>
						<i :className="`icon-${user.anime_list_to_fetch}`" />
						{{ $t('menu.anime_list') }}
					</nuxt-link>
					<nuxt-link
						v-else-if="config?.Users.Enabled"
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
			</client-only>

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
						to="/types/langs"
						@click="closeMenu"
					>
						<font-awesome-icon
							:icon="['fas', 'language']"
							:fixed-width="true"
						/>
						{{ $t('menu.langs') }}
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
								to="/types/songtypes"
								@click="closeMenu"
							>
								<font-awesome-icon
									:icon="['fas', 'list']"
									:fixed-width="true"
								/>
								{{ $t('menu.songtypes') }}
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
								to="/types/years"
								@click="closeMenu"
							>
								<font-awesome-icon
									:icon="['fas', 'calendar-alt']"
									:fixed-width="true"
								/>
								{{ $t('menu.years') }}
							</nuxt-link>
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
				</div>
			</div>
		</nav>

		<div class="columns">
			<aside class="menu is-hidden-touch">
				<ul class="menu-list">
					<li
						v-if="config?.Frontend.AddRepoModalInMenu"
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
							:class="{ 'is-active': $route.name === 'search-query' }"
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
							to="/types/series"
							active-class="is-active"
							:class="{ 'is-active': tagType === '~1' }"
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
							to="/types/singers"
							active-class="is-active"
							:class="{ 'is-active': tagType === '~2' }"
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
							to="/types/langs"
							active-class="is-active"
							:class="{ 'is-active': tagType === '~5' }"
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
									to="/types/songtypes"
									active-class="is-active"
									:class="{ 'is-active': tagType === '~3' }"
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
									to="/types/songwriters"
									active-class="is-active"
									:class="{ 'is-active': tagType === '~8' }"
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
									:class="{ 'is-active': tagType === '~4' }"
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
									:class="{ 'is-active': tagType === '~6' }"
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
									to="/types/years"
									active-class="is-active"
									:class="{ 'is-active': $route.params.year }"
								>
									<font-awesome-icon
										:icon="['fas', 'calendar-alt']"
										:fixed-width="true"
									/>
									{{ $t('menu.years') }}
								</nuxt-link>
							</li>
							<li>
								<nuxt-link
									to="/types/singergroups"
									active-class="is-active"
									:class="{ 'is-active': tagType === '~17' }"
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
									:class="{ 'is-active': tagType === '~7' }"
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
									:class="{ 'is-active': tagType === '~15' }"
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
									:class="{ 'is-active': tagType === '~9' }"
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
									:class="{ 'is-active': tagType === '~10' }"
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
									:class="{ 'is-active': tagType === '~11' }"
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
									:class="{ 'is-active': tagType === '~12' }"
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
									:class="{ 'is-active': tagType === '~13' }"
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
									:class="{ 'is-active': tagType === '~14' }"
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
									:class="{ 'is-active': tagType === '~18' }"
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
				</ul>
				<p class="menu-label">
					{{ $t('menu.community') }}
				</p>
				<ul class="menu-list">
					<li>
						<nuxt-link
							v-if="config?.Users.Enabled"
							to="/playlists"
							active-class="is-active"
						>
							<font-awesome-icon
								:icon="['fas', 'list']"
								:fixed-width="true"
							/>
							{{ $t('menu.playlists') }}
						</nuxt-link>
						<client-only>
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
						</client-only>
						<nuxt-link
							v-if="config?.Users.Enabled"
							to="/users"
							active-class="is-active"
						>
							<font-awesome-icon
								:icon="['fas', 'users']"
								:fixed-width="true"
							/>
							{{ $t('menu.search_users') }}
						</nuxt-link>
						<client-only>
							<nuxt-link
								v-if="loggedIn && user?.roles?.admin"
								to="/bans"
								active-class="is-active"
							>
								<font-awesome-icon
									:icon="['fas', 'ban']"
									:fixed-width="true"
								/>
								{{ $t('menu.bans') }}
							</nuxt-link>
						</client-only>
						<nuxt-link
							v-if="config?.Frontend.DiscordURL"
							:href="config?.Frontend.DiscordURL"
							active-class="is-active"
						>
							<font-awesome-icon
								:icon="['fab', 'discord']"
								:fixed-width="true"
							/>
							{{ $t('menu.discord') }}
						</nuxt-link>
						<nuxt-link
							v-if="config?.Frontend.DiscourseURL"
							:href="config?.Frontend.DiscourseURL"
							active-class="is-active"
						>
							<font-awesome-icon
								:icon="['fab', 'discourse']"
								:fixed-width="true"
							/>
							{{ $t('menu.discourse') }}
						</nuxt-link>
					</li>
					<li>
						<nuxt-link
							v-if="config?.Frontend.Import.Enabled"
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
							v-if="config?.Frontend.Suggestions"
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
								v-if="loggedIn && user && user.anime_list_to_fetch"
								:to="`/user/${user.login}/animelist`"
								active-class="is-active"
								aria-label="My animes"
							>
								<i :className="`icon-${user.anime_list_to_fetch}`" />
								{{ $t('menu.anime_list') }}
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
								:class="languagesOpen && 'is-active'"
								@click="languagesOpen = !languagesOpen"
							>
								<font-awesome-icon
									:icon="['fas', 'globe']"
									:fixed-width="true"
								/>
								{{ $t('menu.switch_language') }}
							</nuxt-link>
							<ul
								v-if="languagesOpen"
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
				<client-only>
					<section
						v-if="banner"
						class="mb-4 hero is-link is-small"
					>
						<div class="hero-body">
							<div class="is-flex is-justify-content-space-between">
								<p class="title">
									{{ $t('layout.app_banner.title') }}
								</p>
								<div>
									<nuxt-link
										class="delete"
										aria-label="close"
										@click="hideBanner"
									/>
								</div>
							</div>
							<p class="subtitle">
								{{ $t('layout.app_banner.description') }}
							</p>
							<p class="subtitle">
								{{ $t('layout.app_banner.more_features', { instance: url.hostname }) }}
							</p>
							<i18n-t
								keypath="layout.app_banner.link"
								tag="p"
								class="subtitle"
							>
								<template #link>
									<nuxt-link
										class="is-underlined"
										:href="`https://mugen.karaokes.moe/${$i18n.locale === 'fr' ? '' : 'en/'}download.html`"
									>
										{{ $t('layout.app_banner.website') }}
									</nuxt-link>
								</template>
							</i18n-t>
						</div>
					</section>
				</client-only>
				<NuxtPage />
			</section>
		</div>
		<footer class="footer">
			<div class="columns has-text-centered">
				<p class="column">
					Karaoke Mugen Server -
					<nuxt-link href="https://api.karaokes.moe/server">
						{{ $t('footer.api_documentation') }}
					</nuxt-link> -
					<nuxt-link href="https://gitlab.com/karaokemugen/code/karaokemugen-server">
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
					<nuxt-link href="https://gitlab.com/karaokemugen/code/karaokemugen-server/-/blob/master/LICENSE.md">
						MIT
					</nuxt-link>
					<template v-if="manifest?.license">
						/ {{ $t('footer.base_under_licence') }}
						<nuxt-link :href="manifest.licenseURL">
							{{ manifest?.license }}
						</nuxt-link>
					</template>
				</p>
			</div>
		</footer>
		<LoginModal
			:active="auth"
			@close="auth = false"
			@login="login"
		/>
		<ProfileModal
			:active="profile"
			@close="profile = false"
			@logout="logout"
		/>
		<AddRepoModal
			:active="addRepo"
			@close="addRepo = false"
		/>
		<DeleteAccountModal
			:active="deleteAccount"
			@close="deleteAccount = false"
			@logout="logout"
		/>
		<JoinKaraModal
			:active="joinKara"
			@close="joinKara = false"
		/>
		<StatsModal
			:active="stats"
			@close="stats = false"
		/>
		<NuxtPwaManifest />
		<a id="downloadAnchorElem" />
	</div>
</template>

<script setup lang="ts">
	import type { KaraList as KaraListType } from '%/lib/types/kara';
	import type { RepositoryManifestV2 } from '%/lib/types/repo';
	import type { LocaleObject } from '@nuxtjs/i18n';
	import { storeToRefs } from 'pinia';
	import slug from 'slug';
	import type { TokenResponseWithRoles } from '~/../kmserver-core/src/lib/types/user';
	import type { Config } from '~/../kmserver-core/src/types/config';
	import { useAuthStore } from '~/store/auth';
	import { useConfigStore, type supportedFilesType } from '~/store/config';
	import { useLocalStorageStore } from '~/store/localStorage';
	import { useMenubarStore } from '~/store/menubar';
	import { useModalStore } from '~/store/modal';

	type TypeMenu = 'community' | 'account' | 'database';

	const { params, fullPath, name } = useRoute();
	const { beforeEach, push } = useRouter();
	const { locale, locales, setLocale } = useI18n();

	const menuOpen = ref<TypeMenu>();
	const tagsOpen = ref(false);
	const languagesOpen = ref(false);
	const manifest = ref<RepositoryManifestV2>();
	
	const { $onAction } = useMenubarStore();
	const { auth, joinKara, stats, deleteAccount, addRepo, profile } = storeToRefs(useModalStore());
	const { closeAll, openModal } = useModalStore();
	const { loggedIn, user } = storeToRefs(useAuthStore());
	const { logout, login: loginApi, updateUser } = useAuthStore();
	const { enabledCollections, banner } = storeToRefs(useLocalStorageStore());
	const { hideBanner, setEnabledCollections } = useLocalStorageStore();
	const { config } = storeToRefs(useConfigStore());
	const { setConfig, setSupportedFiles } = useConfigStore();
	const url = useRequestURL();

	useHead(() => {
		return {
			meta: [
				{ hid: 'og:url', property: 'og:url', content: `${url.protocol}//${url.host}/${fullPath}` }
			],
			titleTemplate: (titleChunk) => {
				// If undefined or blank then we don't need the hyphen
				return titleChunk && titleChunk != 'kmexplorer' ? `${titleChunk} - Karaoke Mugen` : 'Karaoke Mugen';
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

		beforeEach((to: any, _from: any, next: Function) => {
			if (to.params.theater || document.fullscreenElement !== null) {
				document.getElementsByTagName('html')[0].classList.add('theater');
			} else {
				document.getElementsByTagName('html')[0].classList.remove('theater');
			}
			next();
			// Close all the menus after a navigation
			closeAll();
		});
		checkAuth();
		getRepoManifest();
		getConfig();
	});

	async function checkAuth() {
		useCustomFetch<TokenResponseWithRoles>('/api/auth/check').then(res => loginApi(res)).catch(e => logout());
	}

	async function getRepoManifest() {
		const data = await useCustomFetch<{ Manifest: RepositoryManifestV2 }>('/api/karas/repository');
		manifest.value = data.Manifest;
	}

	async function getConfig() {
		const data = await useCustomFetch<Config>('/api/config');
		setConfig(data);
		if (enabledCollections.value.length === 0) setEnabledCollections(data.Frontend.DefaultCollections);
		const { supportedFiles } = await useCustomFetch<{ supportedFiles: supportedFilesType }>('/api/supportedStuff');
		setSupportedFiles(supportedFiles);
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
				safeOnly: true,
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
			const userEdited = { ...user?.value, avatar_file: undefined, roles: undefined, banner: undefined };
			userEdited.language = language;
			updateUser({...user?.value, language})
			useCustomFetch('/api/myaccount', {
				method: 'PATCH',
				body: userEdited
			});
		}
	}

	function setUsedLocale(availableLocale: string) {
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

	.addRepo {
		cursor: pointer;
		max-width: 10em;
	}
	.launchDice {
		margin: 0.75em;
		cursor: pointer;
	}

	aside {
		max-width: 200px;
		padding-right: 15px;
	}
</style>
