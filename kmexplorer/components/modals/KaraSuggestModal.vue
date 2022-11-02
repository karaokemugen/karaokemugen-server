<template>
	<div class="modal" :class="{'is-active': active}">
		<form action="#" @submit.prevent="submitForm">
			<div class="modal-background" @click.prevent="closeModal" />
			<div class="modal-card">
				<header class="modal-card-head">
					<p class="modal-card-title">
						{{ $t('modal.suggest.title') }}
					</p>
					<button class="delete" aria-label="close" @click="closeModal" />
				</header>
				<section v-if="!submitted" class="modal-card-body">
					<h5 class="title is-5">
						{{ $t('modal.suggest.subtitle') }}
					</h5>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label for="title" class="label">{{ $t('modal.suggest.fields.title.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="title"
										v-model="formData.title"
										type="text"
										name="title"
										class="input"
										required
										:placeholder="$t('modal.suggest.fields.title.placeholder')"
										autocomplete="off"
									>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label for="series" class="label">{{ $t('modal.suggest.fields.series.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="series"
										v-model="formData.serie"
										type="text"
										name="series"
										class="input"
										required
										:placeholder="$t('modal.suggest.fields.series.placeholder')"
										autocomplete="off"
									>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label for="type" class="label">{{ $t('modal.suggest.fields.type.label') }}</label>
						</div>
						<div class="field-body">
							<div class="control">
								<div class="select">
									<select id="type" v-model="formData.type" name="type" autocomplete="off">
										<option v-for="songtype in Object.keys(songtypes)" :key="songtype" :value="songtype">
											{{ songtypes[songtype][$i18n.locale] || songtypes[songtype]['eng'] || songtype }}
										</option>
									</select>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label for="link" class="label">{{ $t('modal.suggest.fields.link.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="link"
										v-model="formData.link"
										type="url"
										name="link"
										class="input"
										required
										:placeholder="$t('modal.suggest.fields.link.placeholder')"
										autocomplete="off"
									>
								</div>
							</div>
						</div>
					</div>
					<div class="field is-horizontal">
						<div class="field-label is-normal">
							<label for="name" class="label">{{ $t('modal.suggest.fields.name.label') }}</label>
						</div>
						<div class="field-body">
							<div class="field">
								<div class="control">
									<input
										id="name"
										v-model="formData.username"
										type="text"
										name="name"
										class="input"
										required
										:placeholder="$t('modal.suggest.fields.name.placeholder')"
										autocomplete="username"
									>
								</div>
							</div>
						</div>
					</div>
				</section>
				<section v-else class="modal-card-body">
					<h5 class="title is-5">
						{{ $t('modal.suggest.submitted.subtitle') }}
					</h5>
					<i18n path="modal.suggest.submitted.text" tag="p">
						<template #here>
							<a :href="gitlabUrl" target="_blank">{{ $t('modal.suggest.submitted.here') }}</a>
						</template>
					</i18n>
				</section>
				<footer class="modal-card-foot">
					<button v-if="!submitted" class="button is-success" :class="{'is-loading': loading}" type="submit">
						{{ $t('modal.suggest.submit') }}
					</button>
					<button v-else class="button is-success" type="button" @click="closeModal">
						{{ $t('modal.suggest.submitted.close') }}
					</button>
				</footer>
			</div>
		</form>
	</div>
</template>

<script lang="ts">
	import Vue from 'vue';
	import { mapState } from 'vuex';
	import { TagList } from '%/lib/types/tag';

	interface VState {
		loading: boolean,
		submitted: boolean,
		formData: {
			title: string,
			serie: string,
			type: string,
			link: string,
			username: string
		},
		gitlabUrl: string,
		songtypes: Record<string, Record<string, string>>
	}

	export default Vue.extend({
		name: 'KaraSuggest',

		props: {
			active: Boolean
		},

		data(): VState {
			return {
				loading: false,
				submitted: false,
				formData: {
					title: '',
					serie: '',
					type: 'OP',
					link: '',
					username: ''
				},
				gitlabUrl: '',
				songtypes: {}
			};
		},

		async fetch() {
			const res = await this.$axios.get<TagList>('/api/karas/tags', {
				params: { 
					stripEmpty: true,
					type: 3
				}
			});
			if (res) {
				const songtypes: Record<string, Record<string, string>> = {};
				for (const songtype of res.data.content) {
					songtypes[songtype.name] = songtype.i18n;
				}
				this.songtypes = songtypes;
			}
		},

		computed: mapState('menubar', ['tags']),

		mounted() {
			// Prefill the username field if user is logged in
			if (this.$auth.loggedIn) {
				this.formData.username = this.$auth.user.nickname;
			}
		},

		methods: {
			closeModal(): void {
				this.submitted = false;
				this.$emit('close');
			},
			submitForm() {
				if (this.formData.title && this.formData.serie && this.formData.link) {
					this.loading = true;
					if (!this.formData.username) {
						this.formData.username = 'Anonymous';
					}
					this.$axios.post('/api/karas/suggest', this.formData).then((res) => {
						this.submitted = true;
						this.loading = false;
						this.gitlabUrl = res.data;
						this.formData = {
							title: '',
							serie: '',
							type: 'OP',
							link: '',
							username: ''
						};
					});
				}
			}
		}
	});
</script>

<style scoped lang="scss">
	.field-label {
		flex-grow: 2;
	}

	.select select option {
		color: white;
	}
</style>
