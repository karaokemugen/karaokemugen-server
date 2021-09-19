<template>
	<div>
		<div class="field">
			<label class="label" :title="$t('kara.import.media_file_tooltip', {formats: supportedMedias.join(', ')})">
				{{ $t('kara.import.media_file') }}
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
			<p v-if="!mediafile" class="help is-danger">
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
				:value="karaoke.titles"
				@change="(titles) => karaoke.titles = titles"
			/>
			<p v-if="!karaoke.titles || Object.keys(karaoke.titles).length === 0" class="help is-danger">
				{{ $t('kara.import.title_required') }}
			</p>
			<p v-if="!karaoke.titles.eng" class="help is-danger">
				{{ $t('kara.import.title_eng_required') }}
			</p>
		</div>
		<div class="field">
			<label class="label" :title="$t('kara.import.series_tooltip')">
				{{ $tc('kara.tagtypes.series', karaoke.series.length) }}
				<font-awesome-icon :icon="['fas', 'question-circle']" :fixed-width="true" />
			</label>
			<editable-tag-group
				:tag-type="1"
				:params="karaoke.series"
				@change="(tags) => karaoke.series = tags"
			/>
			<p
				v-if="karaoke.series.length === 0 && karaoke.singers.length === 0"
				class="help is-danger"
			>
				{{ $t('kara.import.series_singers_required') }}
			</p>
		</div>
		<div class="field">
			<label class="label">{{ $tc('kara.tagtypes.songtypes', karaoke.songtypes.length) }}</label>
			<editable-tag-group
				:checkboxes="true"
				:tag-type="3"
				:params="karaoke.songtypes"
				@change="(tags) => karaoke.songtypes = tags"
			/>
			<p
				v-if="karaoke.songtypes.length === 0"
				class="help is-danger"
			>
				{{ $t('kara.import.songtypes_required') }}
			</p>
		</div>
		<div class="field">
			<label class="label">{{ $tc('kara.tagtypes.versions', karaoke.songtypes.length) }}</label>
			<editable-tag-group
				:checkboxes="true"
				:tag-type="14"
				:params="karaoke.versions"
				@change="(tags) => karaoke.versions = tags"
			/>
		</div>
		<div class="field">
			<label class="label" :title="$t('kara.import.songorder_tooltip')">
				{{ $t('kara.import.songorder') }}
				<font-awesome-icon :icon="['fas', 'question-circle']" :fixed-width="true" />
			</label>
			<div class="control">
				<input v-model="karaoke.songorder" class="input short" type="number">
				<p v-if="karaoke.songorder > 999" class="help is-danger">
					{{ $t('kara.import.songorder_invalid') }}
				</p>
			</div>
		</div>
		<div class="field">
			<label class="label">{{ $tc('kara.tagtypes.langs', karaoke.langs.length) }}</label>
			<div class="control">
				<editable-tag-group
					:tag-type="5"
					:params="karaoke.langs"
					@change="(tags) => karaoke.langs = tags"
				/>
				<p v-if="karaoke.langs.length === 0" class="help is-danger">
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
				<input v-model="karaoke.year" class="input short" type="number" min="1800" :max="new Date().getFullYear()">
				<p v-if="!karaoke.year" class="help is-danger">
					{{ $t('kara.import.year_required') }}
				</p>
				<p v-if="karaoke.year && (karaoke.year < 1800 || karaoke.year > new Date().getFullYear())" class="help is-danger">
					{{ $t('kara.import.year_invalid') }}
				</p>
			</div>
		</div>
		<div class="field">
			<label class="label">{{ $t('kara.singers_by') }}</label>
			<div class="control">
				<editable-tag-group
					:tag-type="2"
					:params="karaoke.singers"
					@change="(tags) => karaoke.singers = tags"
				/>
				<p
					v-if="karaoke.series.length === 0 && karaoke.singers.length === 0"
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
					:params="karaoke.songwriters"
					@change="(tags) => karaoke.songwriters = tags"
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
					:params="karaoke.creators"
					@change="(tags) => karaoke.creators = tags"
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
					:params="karaoke.authors"
					@change="(tags) => karaoke.authors = tags"
				/>
				<p
					v-if="karaoke.authors.length === 0"
					class="help is-danger"
				>
					{{ $t('kara.import.authors_required') }}
				</p>
			</div>
		</div>
		<div class="field">
			<label class="label">{{ $tc('kara.tagtypes.families', karaoke.families.length) }}</label>
			<div class="control">
				<editable-tag-group
					:checkboxes="true"
					:tag-type="10"
					:params="karaoke.families"
					@change="(tags) => karaoke.families = tags"
				/>
			</div>
		</div>
		<div class="field">
			<label class="label">{{ $tc('kara.tagtypes.platforms', karaoke.platforms.length) }}</label>
			<div class="control">
				<editable-tag-group
					:checkboxes="true"
					:tag-type="13"
					:params="karaoke.platforms"
					@change="(tags) => karaoke.platforms = tags"
				/>
			</div>
		</div>
		<div class="field">
			<label class="label">{{ $tc('kara.tagtypes.genres', karaoke.genres.length) }}</label>
			<div class="control">
				<editable-tag-group
					:checkboxes="true"
					:tag-type="12"
					:params="karaoke.genres"
					@change="(tags) => karaoke.genres = tags"
				/>
			</div>
		</div>
		<div class="field">
			<label class="label">{{ $tc('kara.tagtypes.origins', karaoke.origins.length) }}</label>
			<div class="control">
				<editable-tag-group
					:checkboxes="true"
					:tag-type="11"
					:params="karaoke.origins"
					@change="(tags) => karaoke.origins = tags"
				/>
			</div>
		</div>
		<div class="field">
			<label class="label">{{ $tc('kara.tagtypes.misc', karaoke.misc.length) }}</label>
			<div class="control">
				<editable-tag-group
					:checkboxes="true"
					:tag-type="7"
					:params="karaoke.misc"
					@change="(tags) => karaoke.misc = tags"
				/>
			</div>
		</div>
		<div class="field">
			<label class="label" :title="$t('kara.import.groups_tooltip')">
				{{ $tc('kara.tagtypes.groups', karaoke.groups.length) }}
				<font-awesome-icon :icon="['fas', 'question-circle']" :fixed-width="true" />
			</label>
			<div class="control">
				<editable-tag-group
					:checkboxes="true"
					:tag-type="9"
					:params="karaoke.groups"
					@change="(tags) => karaoke.groups = tags"
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
					:value="karaoke.created_at ? new Date(karaoke.created_at).toLocaleString() : null"
				>
			</div>
		</div>
		<div class="field">
			<label class="label" :title="$t('kara.import.comment_tooltip')">
				{{ $t('kara.import.comment') }}
				<font-awesome-icon :icon="['fas', 'question-circle']" :fixed-width="true" />
			</label>
			<div class="control">
				<label v-if="karaoke.kid" class="label">{{ $t('kara.import.comment_edit') }}</label>
				<input
					v-model="karaoke.comment"
					class="input"
					type="text"
				>
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
	import Vue, { PropOptions } from 'vue';
	import cloneDeep from 'lodash.clonedeep';

	import EditableTagGroup from './EditableTagGroup.vue';
	import LanguagesList from './LanguagesList.vue';
	import { tagTypes } from '~/assets/constants';
	import { APIMessageType } from '%/lib/types/frontend';
	import { DBKara } from '%/lib/types/database/kara';

	interface DBKaraEdit extends DBKara {
		mediafile_orig?: string,
		subfile_orig?: string
	}

	interface VState {
		tagTypes: typeof tagTypes,
		karaoke: DBKaraEdit,
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
		}
	}

	export default Vue.extend({

		name: 'KaraEdit',

		components: { EditableTagGroup, LanguagesList },
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
				karaoke: cloneDeep(this.karaparam),
				mediafile: this.karaparam?.mediafile,
				subfile: this.karaparam?.subfile,
				mediafile_error: '',
				subfile_error: '',
				supportedLyrics: process.env.SUPPORTED_LYRICS as unknown as string[],
				supportedMedias: process.env.SUPPORTED_MEDIAS as unknown as string[],
				gitlabUrl: '',
				loading: false,
				uploading: {
					media: false,
					sub: false
				}
			};
		},

		computed: {
			submitDisabled(): boolean {
				return Boolean(
					!this.mediafile ||
						this.mediafile_error.length > 0 ||
						this.subfile_error.length > 0 ||
						!this.karaoke.titles ||
						Object.keys(this.karaoke.titles).length === 0 ||
						!this.karaoke.titles.eng ||
						(this.karaoke.series.length === 0 &&
							this.karaoke.singers.length === 0) ||
						this.karaoke.songtypes.length === 0 ||
						this.karaoke.langs.length === 0 ||
						!this.karaoke.year ||
						this.karaoke.year < 1800 ||
						this.karaoke.year > new Date().getFullYear() ||
						this.karaoke.songorder > 999 ||
						this.karaoke.authors.length === 0 ||
						this.uploading.media ||
						this.uploading.sub
				);
			}
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
						const result = await this.$axios.$post(
							'/api/karas/importfile',
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
						this.karaoke.mediafile = result.data.filename;
						this.karaoke.mediafile_orig = result.data.originalname;
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
							'/api/karas/importfile',
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
						this.karaoke.subfile = result.data.filename;
						this.karaoke.subfile_orig = result.data.originalname;
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
				if (this.karaoke.kid) {
					this.$axios.$put(
						`/api/karas/${this.karaoke.kid}`,
						this.karaoke
					).then((res) => {
						this.gitlabUrl = res.data;
					}).catch(() => { this.loading = false; });
				} else {
					this.$axios.$post<APIMessageType>('/api/karas/', this.karaoke).then((res) => {
						this.gitlabUrl = res.data;
					}).catch(() => { this.loading = false; });
				}
				this.loading = false;
			},
			reset() {
				if (this.$route.params.id) {
					this.$router.push('/import');
				} else {
					this.karaoke = this.karaparam;
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
