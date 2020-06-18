<template>
	<div>
		<nav class="navbar is-primary is-fixed-top">
			<div class="navbar-brand">
				<nuxt-link class="navbar-item" to="/">
					<img :src="require('../assets/nanami.png')" alt="Logo" />
					{{ explorerHost }}
				</nuxt-link>
				<a
					role="button"
					class="navbar-burger burger"
					aria-label="menu"
					aria-expanded="false"
					data-target="navbarBasicExample"
					@click="mobileMenu = !mobileMenu"
				>
					<span aria-hidden="true"></span>
					<span aria-hidden="true"></span>
					<span aria-hidden="true"></span>
				</a>
			</div>
			<div :class="`navbar-menu ${mobileMenu && 'is-active'}`">
				<div class="navbar-item" v-if="tag">
					<tag :type="tag.type" :tag="tag.tag" :icon="true" :nolink="true" />
				</div>
				<div class="navbar-item is-expanded">
					<search-bar />
				</div>
				<div class="is-hidden-desktop">
					<nuxt-link class="navbar-item" to="/search">
						<font-awesome-icon :icon="['fas', 'list']" :fixed-width="true" />
						{{$t('menu.karas')}}
					</nuxt-link>
					<nuxt-link class="navbar-item" to="/types">
						<font-awesome-icon :icon="['fas', 'tags']" :fixed-width="true" />
						{{$t('menu.tags')}}
					</nuxt-link>
					<nuxt-link class="navbar-item" to="/import" v-if="import_enabled">
						<font-awesome-icon :icon="['fas', 'file-import']" :fixed-width="true" />
						{{$t('menu.kara_import')}}
					</nuxt-link>
					<a class="navbar-item" @click.prevent="logout" aria-label="Logout" v-if="loggedIn">
						<font-awesome-icon :icon="['fas', 'sign-out-alt']" :fixed-width="true" />
						{{$t('menu.logout')}}
					</a>
					<div v-else>
						<nuxt-link class="navbar-item" to="/login">
							<font-awesome-icon :icon="['fas', 'sign-in-alt']" :fixed-width="true" />
							{{$t('menu.login')}}
						</nuxt-link>
						<nuxt-link class="navbar-item" to="/register">
							<font-awesome-icon :icon="['fas', 'edit']" :fixed-width="true" />
							{{$t('menu.register')}}
						</nuxt-link>
					</div>
				</div>
			</div>
		</nav>

		<div class="columns">
			<aside class="menu is-hidden-touch">
				<p class="menu-label">General</p>
				<ul class="menu-list">
					<li>
						<nuxt-link class="navbar-item" to="/search">
							<font-awesome-icon :icon="['fas', 'list']" :fixed-width="true" />
							{{$t('menu.karas')}}
						</nuxt-link>
					</li>
					<li>
						<nuxt-link class="navbar-item" to="/types">
							<font-awesome-icon :icon="['fas', 'tags']" :fixed-width="true" />
							{{$t('menu.tags')}}
						</nuxt-link>
					</li>
				</ul>
				<p class="menu-label">Administration</p>
				<ul class="menu-list">
					<li>
						<nuxt-link class="navbar-item" to="/import">
							<font-awesome-icon :icon="['fas', 'file-import']" :fixed-width="true" />
							{{$t('menu.kara_import')}}
						</nuxt-link>
					</li>

					<a class="navbar-item" @click.prevent="logout" aria-label="Logout" v-if="loggedIn">
						<font-awesome-icon :icon="['fas', 'sign-out-alt']" :fixed-width="true" />
						{{$t('menu.logout')}}
					</a>
					<div v-else>
						<nuxt-link class="navbar-item" to="/login">
							<font-awesome-icon :icon="['fas', 'sign-in-alt']" :fixed-width="true" />
							{{$t('menu.login')}}
						</nuxt-link>
						<nuxt-link class="navbar-item" to="/register">
							<font-awesome-icon :icon="['fas', 'edit']" :fixed-width="true" />
							{{$t('menu.register')}}
						</nuxt-link>
					</div>
				</ul>
			</aside>
			<section class="container column is-fluid">
				<nuxt />
			</section>
		</div>
		<footer class="footer">
			<div class="columns has-text-centered">
				<p class="column">
					Karaoke Mugen Server -
					<a href="https://lab.shelter.moe/karaokemugen/karaokemugen-server">GIT</a> -
					<a href="http://karaokes.moe">{{$t('footer.home')}}</a>
				</p>
				<p class="column">
					{{$t('footer.software_under_license')}}
					<a
						href="https://lab.shelter.moe/karaokemugen/karaokemugen-server/blob/master/LICENSE.md"
					>MIT</a>
					<template v-if="base_license_name">
						/ {{$t('footer.base_under_licence')}}
						<a :href="base_license_link">{{base_license_name}}</a>
					</template>
				</p>
			</div>
		</footer>
	</div>
</template>

<script lang="ts">
import Vue from "vue";
import Tag from "~/components/Tag";
import SearchBar from "~/components/SearchBar";

export default Vue.extend({
	head: {
		htmlAttrs: {
			class: ["has-navbar-fixed-top"]
		}
	},

	components: {
		Tag,
		SearchBar
	},

	data() {
		return {
			tag: null,
			import_enabled: process.env.KM_IMPORT,
			base_license_name: process.env.BASE_LICENSE_NAME,
			base_license_link: process.env.BASE_LICENSE_LINK,
			explorerHost: process.env.EXPLORER_HOST,
			loggedIn: this.$auth.loggedIn,
			mobileMenu: false
		};
	},

	created() {
		this.$store.subscribe((mutation, _state) => {
			if (mutation.type === "menubar/setTag") {
				this.tag = mutation.payload;
			}
		});
	},

	methods: {
		logout() {
			this.$auth.logout();
			this.loggedIn = false;
		}
	}
});
</script>
<style scoped lang="scss">
.menu {
	margin-left: 15px;
	position: fixed;
}
</style>
