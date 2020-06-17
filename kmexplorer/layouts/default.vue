<template>
	<div>
		<nav class="navbar is-primary is-fixed-top">
			<div class="navbar-brand">
				<nuxt-link class="navbar-item" to="/">
					<font-awesome-icon :icon="['fas', 'igloo']" :fixed-width="true" />
					{{$t('menu.home')}}
				</nuxt-link>
			</div>
			<div class="navbar-menu">
				<div class="navbar-start">
					<div class="navbar-item" v-if="tag">
						<tag :type="tag.type" :tag="tag.tag" :icon="true" :nolink="true" />
					</div>
					<div class="navbar-item is-expanded">
						<search-bar />
					</div>
				</div>
				<div class="navbar-end">
					<div class="navbar-item">
						<nuxt-link class="navbar-item" to="/search">
							<font-awesome-icon :icon="['fas', 'list']" :fixed-width="true" />
							{{$t('menu.karas')}}
						</nuxt-link>
					</div>
					<div class="navbar-item">
						<nuxt-link class="navbar-item" to="/types">
							<font-awesome-icon :icon="['fas', 'tags']" :fixed-width="true" />
							{{$t('menu.tags')}}
						</nuxt-link>
					</div>
					<div v-if="import_enabled" class="navbar-item">
						<nuxt-link class="navbar-item" to="/import">
							<font-awesome-icon :icon="['fas', 'file-import']" :fixed-width="true" />
							{{$t('menu.kara_import')}}
						</nuxt-link>
					</div>
				</div>
			</div>
		</nav>
		<div class="container is-fluid">
			<nuxt />
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
			base_license_link: process.env.BASE_LICENSE_LINK
		};
	},

	created() {
		this.$store.subscribe((mutation, _state) => {
			if (mutation.type === "menubar/setTag") {
				this.tag = mutation.payload;
			}
		});
	}
});
</script>
