<template>
	<div class="box">
		<article class="media">
			<div class="media-content">
				<h4 class="title is-4 content">
					{{ kara.song }}
				</h4>
			</div>
			<div class="media-left">
				<tag
					v-if="kara.language"
					type="langs"
					:tag="{name : getLanguagesFromCode(kara.language)}"
					:staticheight="false"
					icon
					:nolink="true"
				/>
				<tag
					v-if="kara.source && canSeeSource"
					type="groups"
					:tag="{name : kara.source}"
					:staticheight="false"
					icon
					:nolink="true"
				/>
			</div>
			<div class="media-right">
				<button v-if="canDelete" class="button is-danger" :disabled="done.delete" :class="{'is-loading': loading}" @click="subDelete">
					{{ $t('suggestions.kara.remove') }}
				</button>
				<button class="button is-success" :disabled="done.vote" :class="{'is-loading': loading}" @click="submit('like')">
					{{ done.vote ? $t('suggestions.kara.ok'):$t('suggestions.kara.yes') }} ({{ kara.likes }})
				</button>
			</div>
		</article>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import { getLanguagesInLocaleFromCode } from '../utils/isoLanguages';
	import { likesStore } from '~/store';
	import Tag from '~/components/Tag.vue';

	export default Vue.extend({
		name: 'SuggestCard',

		components: {
			Tag
		},

		props: {
			kara: Object
		},

		data() {
			return {
				loading: false,
				done: {
					delete: false,
					vote: false
				}
			};
		},

		computed: {
			canDelete(): boolean {
				return this.$auth.loggedIn && !!this.$auth.user.roles.admin;
			},
			canSeeSource(): boolean {
				return this.$auth.loggedIn && (!!this.$auth.user.roles.admin || !!this.$auth.user.roles.maintainer);
			}
		},

		created() {
			if (likesStore.karas.find(el => el === this.kara.id) !== undefined) {
				this.done.vote = true;
			}
		},

		methods: {
			async submit(type: string) {
				this.loading = true;
				await this.$axios.post(`/api/suggestions/${this.kara.id}`, {
					type
				});
				likesStore.addKara(this.kara.id);
				this.loading = false;
				this.done.vote = true;
				this.kara.likes++;
			},
			async subDelete() {
				this.loading = true;
				await this.$axios.delete(`/api/suggestions/${this.kara.id}`);
				this.loading = false;
				this.done.delete = true;
			},
			getLanguagesFromCode(code:string) {
				return getLanguagesInLocaleFromCode(code, (this.$auth.loggedIn && this.$auth.user.language) || this.$i18n.locale);
			}
		}
	});
</script>

<style lang="scss">

article.media {
	align-items: center;
}

@media screen and (max-width: 700px) {
	article.media {
		flex-direction: column;
	}
}

div.media-content {
    margin: auto 0;
}

h4.title {
    overflow: hidden;
}

@media (max-width: 540px) {
    div.media-right {
        flex-shrink: unset;
    }
    div.button {
        justify-content: right;
    }
}
</style>
