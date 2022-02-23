<template>
	<div>
		<div class="field">
			<label class="label" :title="$t('kara.import.media_file_tooltip', {formats: supportedMedias.join(', ')})">
				{{ $route.params.id ? $t('kara.import.media_file_edit'):$t('kara.import.media_file') }}
				<font-awesome-icon :icon="['fas', 'question-circle']" :fixed-width="true" />
			</label>
			<div class="file has-name is-fullwidth" :class="{'is-attached-bottom': uploading.media}">
				<label class="file-label">
					<input
						ref="mediafile"
						class="file-input"
						type="file"
						name="resume"
						accept="video/*, audio/*, .mkv"
						@change="handleMediafileUpload()"
					>
					<span class="file-cta">
						<span class="file-icon">
							<font-awesome-icon :icon="['fas', 'upload']" :fixed-width="true" />
						</span>
						<span class="file-label">{{ $t('kara.import.choose_file') }}</span>
					</span>
					<span class="file-name">{{ mediafile }}</span>
				</label>
			</div>
			<progress v-if="uploading.media" class="progress is-success is-attached-top" :value="uploading.media === true ? undefined:uploading.media" max="100" />
			<p v-if="!$route.params.id && !mediafile" class="help is-danger">
				{{ $t('kara.import.media_file_required') }}
			</p>
			<p v-if="mediafile_error" class="help is-danger">
				{{ mediafile_error }}
			</p>
		</div>
		<div class="field">
			<label class="label" :title="$t('kara.import.lyrics_file_tooltip', {formats: supportedLyrics.join(', ')})">
				{{ $t('kara.import.lyrics_file') }}
				<font-awesome-icon :icon="['fas', 'question-circle']" :fixed-width="true" />
			</label>
			<div class="file has-name is-fullwidth" :class="{'is-attached-bottom': uploading.sub}">
				<label class="file-label">
					<input
						ref="subfile"
						class="file-input"
						type="file"
						name="resume"
						:accept="supportedLyrics.map(val => '.'+val).join(',')"
						@change="handleSubfileUpload()"
					>
					<span class="file-cta">
						<span class="file-icon">
							<font-awesome-icon :icon="['fas', 'upload']" :fixed-width="true" />
						</span>
						<span class="file-label">{{ $t('kara.import.choose_file') }}</span>
					</span>
					<span class="file-name">{{ subfile }}</span>
				</label>
			</div>
			<progress v-if="uploading.sub" class="progress is-success is-attached-top" :value="uploading.sub === true ? undefined:uploading.sub" max="100" />
			<p v-if="subfile_error" class="help is-danger">
				{{ subfile_error }}
			</p>
		</div>
		<div class="field">
			<label class="label" :title="$t('kara.import.title_tooltip')">
				{{ $t('kara.import.title') }}
				<font-awesome-icon :icon="['fas', 'question-circle']" :fixed-width="true" />
			</label>
			<languages-list
				:value="karaoke.data.titles"
				@change="(titles) => karaoke.data.titles = titles"
			/>
			<p v-if="!karaoke.data.titles || Object.keys(karaoke.data.titles).length === 0" class="help is-danger">
				{{ $t('kara.import.title_required') }}
			</p>
			<p v-if="!karaoke.data.titles.eng" class="help is-danger">
				{{ $t('kara.import.title_eng_required') }}
			</p>
			<label class="label" :title="$t('kara.import.titles_aliases_tooltip')">
				{{ $t('kara.import.titles_aliases') }}
				<font-awesome-icon :icon="['fas', 'question-circle']" :fixed-width="true" />
			</label>
			<editable-alias-group
				:params="karaoke.data.titles_aliases"
				@change="(aliases) => karaoke.data.titles_aliases = aliases"
			/>
		</div>
		<div class="field">
			<label class="label" :title="$t('kara.import.series_tooltip')">
				{{ $tc('kara.tagtypes.series', karaoke.data.tags.series.length) }}
				<font-awesome-icon :icon="['fas', 'question-circle']" :fixed-width="true" />
			</label>
			<editable-tag-group
				:tag-type="1"
				:params="karaoke.data.tags.series"
				@change="(tags) => karaoke.data.tags.series = tags"
			/>
			<p
				v-if="karaoke.data.tags.series.length === 0 && karaoke.data.tags.singers.length === 0"
				class="help is-danger"
			>
				{{ $t('kara.import.series_singers_required') }}
			</p>
		</div>
		<div class="field">
			<label class="label">{{ $tc('kara.tagtypes.songtypes', karaoke.data.tags.songtypes.length) }}</label>
			<editable-tag-group
				:checkboxes="true"
				:tag-type="3"
				:params="karaoke.data.tags.songtypes"
				@change="(tags) => karaoke.data.tags.songtypes = tags"
			/>
			<p
				v-if="karaoke.data.tags.songtypes.length === 0"
				class="help is-danger"
			>
				{{ $t('kara.import.songtypes_required') }}
			</p>
		</div>
		<div class="field">
			<label class="label">{{ $tc('kara.tagtypes.versions', karaoke.data.tags.versions.length) }}</label>
			<editable-tag-group
				:checkboxes="true"
				:tag-type="14"
				:params="karaoke.data.tags.versions"
				@change="(tags) => karaoke.data.tags.versions = tags"
			/>
		</div>
		<div class="field">
			<label class="label" :title="$t('kara.import.songorder_tooltip')">
				{{ $t('kara.import.songorder') }}
				<font-awesome-icon :icon="['fas', 'question-circle']" :fixed-width="true" />
			</label>
			<div class="control">
				<input v-model="karaoke.data.songorder" class="input short" type="number">
				<p v-if="karaoke.data.songorder > 999" class="help is-danger">
					{{ $t('kara.import.songorder_invalid') }}
				</p>
			</div>
		</div>
		<div class="field">
			<label class="label">{{ $tc('kara.tagtypes.langs', karaoke.data.tags.langs.length) }}</label>
			<div class="control">
				<editable-tag-group
					:tag-type="5"
					:params="karaoke.data.tags.langs"
					no-create
					@change="(tags) => karaoke.data.tags.langs = tags"
				/>
				<p v-if="karaoke.data.tags.langs.length === 0" class="help is-danger">
					{{ $t('kara.import.langs_required') }}
				</p>
			</div>
		</div>
		<div class="field">
			<label class="label" :title="$t('kara.import.year_tooltip')">
				{{ $t('kara.import.year') }}
				<font-awesome-icon :icon="['fas', 'question-circle']" :fixed-width="true" />
			</label>
			<div class="control">
				<input v-model="karaoke.data.year" class="input short" type="number" min="1800" :max="new Date().getFullYear()">
				<p v-if="!karaoke.data.year" class="help is-danger">
					{{ $t('kara.import.year_required') }}
				</p>
				<p v-if="karaoke.data.year && (karaoke.data.year < 1800 || karaoke.data.year > new Date().getFullYear())" class="help is-danger">
					{{ $t('kara.import.year_invalid') }}
				</p>
			</div>
		</div>
		<div class="field">
			<label class="label">{{ $t('kara.singers_by') }}</label>
			<div class="control">
				<editable-tag-group
					:tag-type="2"
					:params="karaoke.data.tags.singers"
					@change="(tags) => karaoke.data.tags.singers = tags"
				/>
				<p
					v-if="karaoke.data.tags.series.length === 0 && karaoke.data.tags.singers.length === 0"
					class="help is-danger"
				>
					{{ $t('kara.import.series_singers_required') }}
				</p>
			</div>
		</div>
		<div class="field">
			<label class="label" :title="$t('kara.import.songwriters_tooltip')">
				{{ $t('kara.songwriters_by') }}
				<font-awesome-icon :icon="['fas', 'question-circle']" :fixed-width="true" />
			</label>
			<div class="control">
				<editable-tag-group
					:tag-type="8"
					:params="karaoke.data.tags.songwriters"
					@change="(tags) => karaoke.data.tags.songwriters = tags"
				/>
			</div>
		</div>
		<div class="field">
			<label class="label" :title="$t('kara.import.creators_tooltip')">
				{{ $t('kara.creators_by') }}
				<font-awesome-icon :icon="['fas', 'question-circle']" :fixed-width="true" />
			</label>
			<div class="control">
				<editable-tag-group
					:tag-type="4"
					:params="karaoke.data.tags.creators"
					@change="(tags) => karaoke.data.tags.creators = tags"
				/>
			</div>
		</div>
		<div class="field">
			<label class="label" :title="$t('kara.import.authors_tooltip')">
				{{ $t('kara.authors_by') }}
				<font-awesome-icon :icon="['fas', 'question-circle']" :fixed-width="true" />
			</label>
			<div class="control">
				<editable-tag-group
					:tag-type="6"
					:params="karaoke.data.tags.authors"
					@change="(tags) => karaoke.data.tags.authors = tags"
				/>
				<p
					v-if="karaoke.data.tags.authors.length === 0"
					class="help is-danger"
				>
					{{ $t('kara.import.authors_required') }}
				</p>
			</div>
		</div>
		<div class="field">
			<label class="label">{{ $tc('kara.tagtypes.families', karaoke.data.tags.families.length) }}</label>
			<div class="control">
				<editable-tag-group
					:checkboxes="true"
					:tag-type="10"
					:params="karaoke.data.tags.families"
					@change="(tags) => karaoke.data.tags.families = tags"
				/>
			</div>
		</div>
		<div class="field">
			<label class="label">{{ $tc('kara.tagtypes.platforms', karaoke.data.tags.platforms.length) }}</label>
			<div class="control">
				<editable-tag-group
					:checkboxes="true"
					:tag-type="13"
					:params="karaoke.data.tags.platforms"
					@change="(tags) => karaoke.data.tags.platforms = tags"
				/>
			</div>
		</div>
		<div class="field">
			<label class="label">{{ $tc('kara.tagtypes.genres', karaoke.data.tags.genres.length) }}</label>
			<div class="control">
				<editable-tag-group
					:checkboxes="true"
					:tag-type="12"
					:params="karaoke.data.tags.genres"
					@change="(tags) => karaoke.data.tags.genres = tags"
				/>
			</div>
		</div>
		<div class="field">
			<label class="label">{{ $tc('kara.tagtypes.origins', karaoke.data.tags.origins.length) }}</label>
			<div class="control">
				<editable-tag-group
					:checkboxes="true"
					:tag-type="11"
					:params="karaoke.data.tags.origins"
					@change="(tags) => karaoke.data.tags.origins = tags"
				/>
			</div>
		</div>
		<div class="field">
			<label class="label">{{ $tc('kara.tagtypes.misc', karaoke.data.tags.misc.length) }}</label>
			<div class="control">
				<editable-tag-group
					:checkboxes="true"
					:tag-type="7"
					:params="karaoke.data.tags.misc"
					@change="(tags) => karaoke.data.tags.misc = tags"
				/>
			</div>
		</div>
		<div class="field">
			<label class="label">{{ $tc('kara.tagtypes.warnings', karaoke.data.tags.warnings.length) }}</label>
			<div class="control">
				<editable-tag-group
					:checkboxes="true"
					:tag-type="15"
					:params="karaoke.data.tags.warnings"
					@change="(tags) => karaoke.data.tags.warnings = tags"
				/>
			</div>
		</div>
		<div class="field">
			<label class="label" :title="$t('kara.import.groups_tooltip')">
				{{ $tc('kara.tagtypes.groups', karaoke.data.tags.groups.length) }}
				<font-awesome-icon :icon="['fas', 'question-circle']" :fixed-width="true" />
			</label>
			<div class="control">
				<editable-tag-group
					:checkboxes="true"
					:tag-type="9"
					:params="karaoke.data.tags.groups"
					@change="(tags) => karaoke.data.tags.groups = tags"
				/>
			</div>
		</div>
		<div class="field">
			<label class="label">{{ $t('kara.import.created_at') }}</label>
			<div class="control">
				<input
					class="input is-static"
					type="text"
					readonly
					:value="karaoke.data.created_at ? new Date(karaoke.data.created_at).toLocaleString() : null"
				>
			</div>
		</div>
		<div class="field">
			<label class="label" :title="$t('kara.import.comment_tooltip')">
				{{ $t('kara.import.comment') }}
				<font-awesome-icon :icon="['fas', 'question-circle']" :fixed-width="true" />
			</label>
			<div class="control">
				<input
					v-model="karaoke.data.comment"
					class="input"
					type="text"
				>
			</div>
		</div>
		<div v-if="loggedIn" class="field">
			<label for="contact">
				<input
					id="contact"
					v-model="sendContactInfos"
					type="checkbox"
				>
				{{ $t('kara.import.send_contact_infos') }}
			</label>
		</div>
		<div v-if="!loggedIn" class="field">
			<label class="label" :title="$t('kara.import.contact_infos_tooltip')">
				{{ $t('kara.import.contact_infos') }}
				<font-awesome-icon :icon="['fas', 'question-circle']" :fixed-width="true" />
			</label>
			<div class="control">
				<input
					v-model="contactInfos"
					class="input"
					type="text"
				>
				<label>{{ $t('kara.import.auto_send_contact_infos') }}</label>
			</div>
		</div>
		<div class="field">
			<div class="control submit">
				<button
					class="button is-link"
					:class="{'is-loading': loading}"
					:disabled="submitDisabled"
					@click="submit"
				>
					{{ $t('kara.import.submit') }}
				</button>
				<span v-if="!subfile && !subfile_error" class="help is-warning">{{ $t('kara.import.lyrics_file_missing') }}</span>
			</div>
		</div>
		<div class="modal" :class="{'is-active': gitlabUrl}">
			<div class="modal-background" />
			<div class="modal-card">
				<header class="modal-card-head">
					<p class="modal-card-title">
						{{ $t('kara.import.add_success') }}
					</p>
					<a class="delete" aria-label="close" @click.prevent="reset" />
				</header>
				<i18n path="kara.import.add_success_description" tag="section" class="modal-card-body">
					<template #url>
						<a :href="gitlabUrl" target="_blank">
							{{ gitlabUrl }}
						</a>
					</template>
				</i18n>
				<footer class="modal-card-foot">
					<button class="button is-success" @click.prevent="reset">
						{{ $t('kara.import.restart') }}
					</button>
				</footer>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import { v4 as uuid } from 'uuid';
	import Vue, { PropOptions } from 'vue';
	import { mapState } from 'vuex';
	import { cloneDeep } from 'lodash';

	import EditableTagGroup from './EditableTagGroup.vue';
	import EditableAliasGroup from './EditableAliasGroup.vue';
	import LanguagesList from './LanguagesList.vue';
	import { tagTypes } from '~/assets/constants';
	import { KaraFileV4, MediaInfo } from '%/lib/types/kara';
	import { DBKara } from '%/lib/types/database/kara';
	import { DBKaraToKaraFile, determineVersion } from '~/utils/kara';

	interface VState {
		tagTypes: typeof tagTypes,
		karaoke: KaraFileV4,
		mediafile: string,
		subfile: string,
		mediafile_error: string,
		subfile_error: string,
		supportedLyrics: string[],
		supportedMedias: string[],
		gitlabUrl: string,
		loading: boolean,
		uploading: {
			media: boolean | number,
			sub: boolean | number
		},
		sendContactInfos: boolean,
		contactInfos: string
	}

	export default Vue.extend({

		name: 'KaraEdit',

		components: { EditableTagGroup, EditableAliasGroup, LanguagesList },
		props: {
			karaparam: {
				type: Object,
				required: false
			} as PropOptions<DBKara>,
			i18n: {
				type: Object,
				required: false
			}
		},

		data(): VState {
			return {
				tagTypes,
				karaoke: DBKaraToKaraFile(this.karaparam),
				mediafile: '',
				subfile: '',
				mediafile_error: '',
				subfile_error: '',
				supportedLyrics: process.env.SUPPORTED_LYRICS as unknown as string[],
				supportedMedias: process.env.SUPPORTED_MEDIAS as unknown as string[],
				gitlabUrl: '',
				loading: false,
				uploading: {
					media: false,
					sub: false
				},
				sendContactInfos: (process as any)?.client
					? localStorage.getItem('sendContactInfos') === 'true'
					: false,
				contactInfos: ''
			};
		},

		computed: {
			submitDisabled(): boolean {
				return Boolean(
					(!this.$route.params.id && !this.mediafile) ||
						this.mediafile_error.length > 0 ||
						this.subfile_error.length > 0 ||
						!this.karaoke.data.titles ||
						Object.keys(this.karaoke.data.titles).length === 0 ||
						!this.karaoke.data.titles.eng ||
						(this.karaoke.data.tags.series?.length === 0 &&
							this.karaoke.data.tags.singers?.length === 0) ||
						this.karaoke.data.tags.songtypes.length === 0 ||
						this.karaoke.data.tags.langs.length === 0 ||
						!this.karaoke.data.year ||
						this.karaoke.data.year < 1800 ||
						this.karaoke.data.year > new Date().getFullYear() ||
						(this.karaoke.data.songorder || 0) > 999 ||
						this.karaoke.data.tags.authors?.length === 0 ||
						this.uploading.media ||
						this.uploading.sub ||
						this.loading
				);
			},
			...mapState('auth', ['loggedIn'])
		},

		methods: {
			async handleMediafileUpload() {
				if ((this.$refs.mediafile as HTMLInputElement)?.files?.length !== 0) {
					// @ts-ignore: sisi y'a eu un typecheck en haut, ta gueule mtn :)
					const file = (this.$refs.mediafile as HTMLInputElement).files[0];
					this.mediafile_error = '';
					if (!file || !this.isMediaFile(file.name)) {
						this.mediafile_error = this.$t(
							'kara.import.add_file_media_error',
							{
								name: file?.name
							}
						) as string;
					} else {
						this.mediafile = file.name;
						this.uploading.media = true;
						this.mediafile_error = '';
						const formData = new FormData();
						formData.append('file', file);
						const result: MediaInfo = await this.$axios.$post(
							'/api/karas/importMedia',
							formData,
							{
								headers: {
									'Content-Type': 'multipart/form-data'
								},
								onUploadProgress: (progressEvent) => {
									this.uploading.media = Math.round((progressEvent.loaded * 100) / progressEvent.total);
								}
							}
						);
						this.karaoke.medias = [{
							version: determineVersion(this.karaoke.data.titles),
							filename: result.filename,
							audiogain: result.gain,
							loudnorm: result.loudnorm,
							filesize: Number(result.size),
							duration: result.duration,
							default: true,
							lyrics: this.karaoke.medias[0].lyrics || []
						}];
						this.uploading.media = false;
					}
				}
			},
			async handleSubfileUpload() {
				if ((this.$refs.subfile as HTMLInputElement)?.files?.length !== 0) {
					// @ts-ignore: sisi y'a eu un typecheck en haut, ta gueule mtn :)
					const file = (this.$refs.subfile as HTMLInputElement).files[0];
					this.mediafile_error = '';
					if (!file || !this.isSubFile(file.name)) {
						this.subfile_error = this.$t(
							'kara.import.add_file_lyrics_error',
							{
								name: file?.name
							}
						) as string;
					} else {
						this.subfile = file.name;
						this.uploading.sub = true;
						this.subfile_error = '';
						const formData = new FormData();
						formData.append('file', file);
						const result = await this.$axios.$post(
							'/api/karas/importSub',
							formData,
							{
								headers: {
									'Content-Type': 'multipart/form-data'
								},
								onUploadProgress: (progressEvent) => {
									this.uploading.sub = Math.round((progressEvent.loaded * 100) / progressEvent.total);
								}
							}
						);
						this.karaoke.medias[0].lyrics = [{
							filename: result,
							default: true,
							version: 'Default'
						}];
						this.uploading.sub = false;
					}
				}
			},
			isMediaFile(filename: string) {
				return new RegExp(
					`^.+\\.(${this.supportedMedias.join('|')})$`
				).test(filename);
			},
			isSubFile(filename: string) {
				return new RegExp(
					`^.+\\.(${this.supportedLyrics.join('|')})$`
				).test(filename);
			},
			submit() {
				this.loading = true;
				let contact: string = '';
				if (this.$auth.loggedIn && this.sendContactInfos) {
					contact = `${this.$auth.user.login}@${process.env.API_HOST}`;
					if ((process as any).client) {
						localStorage.setItem('sendContactInfos', 'true');
					}
				} else if (!this.$auth.loggedIn) {
					contact = this.contactInfos;
				} else if ((process as any).client) {
					localStorage.setItem('sendContactInfos', 'false');
				}
				const karaoke = cloneDeep(this.karaoke);
				for (const tag of Object.keys(karaoke.data.tags)) {
					// @ts-ignore: Object.keys type inference is bad hot take
					if (tag in karaoke.data.tags && karaoke.data.tags[tag].length === 0) {
						// @ts-ignore
						delete karaoke.data.tags[tag];
					}
				}
				karaoke.data.title = karaoke.data.titles.eng;
				if (this.$route.params.id) {
					this.$axios.$put(
						`/api/karas/${this.karaoke.data.kid}`,
						{
							kara: karaoke,
							modifiedMedia: !!this.mediafile,
							modifiedLyrics: !!this.subfile,
							contact
						}
					).then((res) => {
						this.gitlabUrl = res.data;
					}).finally(() => {
						this.loading = false;
					});
				} else {
					this.$axios.$post(
						'/api/karas/',
						{ kara: karaoke, contact }
					).then((res) => {
						this.gitlabUrl = res.data;
					}).finally(() => {
						this.loading = false;
					});
				}
			},
			reset() {
				if (this.$route.params.id) {
					this.$router.push('/import');
				} else {
					this.karaoke = DBKaraToKaraFile({ ...this.karaparam, kid: uuid() });
					this.mediafile = '';
					this.subfile = '';
					this.mediafile_error = '';
					this.subfile_error = '';
					this.gitlabUrl = '';
					(this.$refs.mediafile as HTMLInputElement).value = '';
					(this.$refs.subfile as HTMLInputElement).value = '';
				}
			}
		}
	});
</script>

<style scoped lang="scss">
	.tags {
		margin-top: 0.5rem;
		display: unset;

		.tag *:first-child {
			margin-right: 0.25rem;
		}
	}

	.field {
		margin-bottom: 25px;
	}

	.submit {
		text-align: right;
	}

	.message {
		max-width: 50em;
	}

	.input.short {
		width: 6em;
	}

	.file.has-name.is-attached-bottom {
		.file-cta {
			border-bottom-left-radius: 0;
			border-bottom: 0;
		}
		.file-name {
			border-bottom-right-radius: 0;
			border-bottom: 0;
		}
	}

	.progress.is-attached-top {
		border: 1px #5e6d6f solid;
		border-top-left-radius: 0;
		border-top-right-radius: 0;
		margin-bottom: 0;
		background-color: inherit;
	}
</style>
