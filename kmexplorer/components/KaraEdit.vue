<template>
	<div>
		<label class="title">{{ t('kara.import.sections.files') }}</label>
		<div class="box">
			<div class="field">
				<label
					class="label"
					:title="t('kara.import.media_file_tooltip', {formats: supportedMedias.join(', ')})"
				>
					{{ $route.params.id ? t('kara.import.media_file_edit'):t('kara.import.media_file') }}
					<font-awesome-icon
						:icon="['fas', 'question-circle']"
						:fixed-width="true"
					/>
				</label>
				<div
					class="file has-name is-fullwidth"
					:class="{'is-attached-bottom': uploading_media}"
				>
					<label class="file-label">
						<input
							ref="mediafileInput"
							class="file-input"
							type="file"
							name="resume"
							accept="video/*, audio/*, .mkv"
							@change="handleMediafileUpload()"
						>
						<span class="file-cta">
							<span class="file-icon">
								<font-awesome-icon
									:icon="['fas', 'upload']"
									:fixed-width="true"
								/>
							</span>
							<span class="file-label">{{ t('kara.import.choose_file') }}</span>
						</span>
						<span class="file-name">{{ mediafile }}</span>
					</label>
				</div>
				<progress
					v-if="uploading_media"
					class="progress is-success is-attached-top"
					:value="uploading_media === true ? undefined : uploading_media"
					max="100"
				/>
				<p
					v-if="!$route.params.id && !mediafile"
					class="help is-danger"
				>
					{{ t('kara.import.media_file_required') }}
				</p>
				<p
					v-if="mediafile_error"
					class="help is-danger"
				>
					{{ mediafile_error }}
				</p>
			</div>
			<div class="field">
				<label
					class="label"
					:title="t('kara.import.lyrics_file_tooltip', {formats: supportedLyrics.join(', ')})"
				>
					{{ t('kara.import.lyrics_file') }}
					<font-awesome-icon
						:icon="['fas', 'question-circle']"
						:fixed-width="true"
					/>
				</label>
				<div
					class="file has-name is-fullwidth"
					:class="{'is-attached-bottom': uploading_sub}"
				>
					<label class="file-label">
						<input
							ref="subfileInput"
							class="file-input"
							type="file"
							name="resume"
							:accept="supportedLyrics.map(val => '.'+val).join(',')"
							@change="handleSubfileUpload()"
						>
						<span class="file-cta">
							<span class="file-icon">
								<font-awesome-icon
									:icon="['fas', 'upload']"
									:fixed-width="true"
								/>
							</span>
							<span class="file-label">{{ t('kara.import.choose_file') }}</span>
						</span>
						<span class="file-name">{{ subfile }}</span>
					</label>
				</div>
				<progress
					v-if="uploading_sub"
					class="progress is-success is-attached-top"
					:value="uploading_sub === true ? undefined : uploading_sub"
					max="100"
				/>
				<p
					v-if="subfile_error"
					class="help is-danger"
				>
					{{ subfile_error }}
				</p>
			</div>
		</div>
		<label class="title">{{ $t('kara.import.sections.parents') }}</label>
		<div class="box">
			<div class="content">
				<p>{{ $t('kara.import.desc.parents') }}</p>
				<p>{{ $t('kara.import.desc.parents_public') }}</p>
			</div>
			<div class="field">
				<label
					class="label"
					:title="$t('kara.import.parents_tooltip')"
				>
					{{ $t('kara.import.parents') }}
					<font-awesome-icon
						:icon="['fas', 'question-circle']"
						:fixed-width="true"
					/>
				</label>
				<div class="tags">
					<span
						v-for="tag in parents"
						:key="tag.value"
						class="tag"
					>
						{{ tag.label }}
						<nuxt-link
							class="delete is-small"
							@click.prevent="() => parents = parents.filter(parent => parent.value !== tag.value)"
						/>
					</span>
				</div>
				<o-autocomplete
					v-model="currentParent"
					open-on-focus
					clear-on-select
					:data="karaSearch"
					field="label"
					@typing="debouncedGetAsyncData"
					@select="onParentKaraChange"
				/>
			</div>
		</div>
		<label class="title">{{ t('kara.import.sections.titles') }}</label>
		<div class="box">
			<div class="content">
				<p>{{ t('kara.import.desc.titles') }}</p>
				<p>{{ t('kara.import.desc.titles_default_language') }}</p>
			</div>
			<div class="field">
				<label
					class="label"
					:title="t('kara.import.title_tooltip')"
				>
					{{ t('kara.import.title') }}
					<font-awesome-icon
						:icon="['fas', 'question-circle']"
						:fixed-width="true"
					/>
				</label>
				<languages-list
					:value="karaoke.data.titles"
					:default-language="karaoke.data.titles_default_language"
					@change="onTitlesChange"
					@on-default-language="onDefaultLanguageSelect"
				/>
				<p
					v-if="!karaoke.data.titles || Object.keys(karaoke.data.titles).length === 0 || Object.values(karaoke.data.titles).includes('')"
					class="help is-danger"
				>
					{{ t('kara.import.title_required') }}
				</p>
				<label
					class="label"
					:title="t('kara.import.titles_aliases_tooltip')"
				>
					{{ t('kara.import.titles_aliases') }}
					<font-awesome-icon
						:icon="['fas', 'question-circle']"
						:fixed-width="true"
					/>
				</label>
				<editable-alias-group
					:params="karaoke.data.titles_aliases || []"
					@change="(aliases) => karaoke.data.titles_aliases = aliases"
				/>
			</div>
		</div>
		<label class="title">{{ t('kara.import.sections.identity') }}</label>
		<div class="box">
			<div class="field">
				<label class="label">{{ t('kara.tagtypes.langs', karaoke.data.tags.langs.length) }}</label>
				<div class="control">
					<editable-tag-group
						:tag-type="5"
						:params="karaoke.data.tags.langs"
						no-create
						@change="(tags) => karaoke.data.tags.langs = tags"
					/>
					<p
						v-if="karaoke.data.tags.langs.length === 0"
						class="help is-danger"
					>
						{{ t('kara.import.langs_required') }}
					</p>
				</div>
			</div>
			<div class="field">
				<label
					class="label"
					:title="t('kara.import.series_tooltip')"
				>
					{{ t('kara.tagtypes.series', karaoke.data.tags.series.length) }}
					<font-awesome-icon
						:icon="['fas', 'question-circle']"
						:fixed-width="true"
					/>
				</label>
				<editable-tag-group
					:tag-type="1"
					:params="karaoke.data.tags.series"
					@change="(tags) => karaoke.data.tags.series = tags"
				/>
				<p
					v-if="karaoke.data.tags.series.length === 0 && karaoke.data.tags.singers.length === 0 && karaoke.data.tags.singergroups.length === 0"
					class="help is-danger"
				>
					{{ t('kara.import.series_singers_required') }}
				</p>
			</div>
			<div class="field">
				<label
					class="label"
					:title="t('kara.import.franchises_tooltip')"
				>
					{{ t('kara.tagtypes.franchises', karaoke.data.tags.franchises.length) }}
					<font-awesome-icon
						:icon="['fas', 'question-circle']"
						:fixed-width="true"
					/>
				</label>
				<editable-tag-group
					:tag-type="18"
					:params="karaoke.data.tags.franchises"
					@change="(tags) => karaoke.data.tags.franchises = tags"
				/>
			</div>
			<div class="field">
				<label class="label">{{ t('kara.tagtypes.songtypes', karaoke.data.tags.songtypes.length) }}</label>
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
					{{ t('kara.import.songtypes_required') }}
				</p>
			</div>
			<div class="field">
				<label
					class="label"
					:title="t('kara.import.songorder_tooltip')"
				>
					{{ t('kara.import.songorder') }}
					<font-awesome-icon
						:icon="['fas', 'question-circle']"
						:fixed-width="true"
					/>
				</label>
				<div class="control">
					<input
						v-model="karaoke.data.songorder"
						class="input short"
						type="number"
					>
					<p
						v-if="karaoke.data.songorder && karaoke.data.songorder > 999"
						class="help is-danger"
					>
						{{ t('kara.import.songorder_invalid') }}
					</p>
				</div>
			</div>
			<div class="field">
				<label class="label">{{ t('kara.tagtypes.versions', karaoke.data.tags.versions.length) }}</label>
				<editable-tag-group
					:checkboxes="true"
					:tag-type="14"
					:params="karaoke.data.tags.versions"
					@change="(tags) => karaoke.data.tags.versions = tags"
				/>
			</div>
			<div class="field">
				<label class="label">{{ t('kara.singers_by') }}</label>
				<div class="control">
					<editable-tag-group
						:tag-type="2"
						:params="karaoke.data.tags.singers"
						@change="(tags) => karaoke.data.tags.singers = tags"
					/>
					<p
						v-if="karaoke.data.tags.series.length === 0 && karaoke.data.tags.singers.length === 0 && karaoke.data.tags.singergroups.length === 0"
						class="help is-danger"
					>
						{{ t('kara.import.series_singers_required') }}
					</p>
				</div>
			</div>
			<div class="field">
				<label
					class="label"
					:title="t('kara.import.singergroups_tooltip')"
				>
					{{ t('kara.singergroups_by') }}
					<font-awesome-icon
						:icon="['fas', 'question-circle']"
						:fixed-width="true"
					/>
				</label>
				<div class="control">
					<editable-tag-group
						:tag-type="17"
						:params="karaoke.data.tags.singergroups"
						@change="(tags) => karaoke.data.tags.singergroups = tags"
					/>
					<p
						v-if="karaoke.data.tags.series.length === 0 && karaoke.data.tags.singers.length === 0 && karaoke.data.tags.singergroups.length === 0"
						class="help is-danger"
					>
						{{ t('kara.import.series_singers_required') }}
					</p>
				</div>
			</div>
			<div class="field">
				<label
					class="label"
					:title="t('kara.import.songwriters_tooltip')"
				>
					{{ t('kara.songwriters_by') }}
					<font-awesome-icon
						:icon="['fas', 'question-circle']"
						:fixed-width="true"
					/>
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
				<label
					class="label"
					:title="t('kara.import.creators_tooltip')"
				>
					{{ t('kara.creators_by') }}
					<font-awesome-icon
						:icon="['fas', 'question-circle']"
						:fixed-width="true"
					/>
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
				<label
					class="label"
					:title="t('kara.import.year_tooltip')"
				>
					{{ t('kara.import.year') }}
					<font-awesome-icon
						:icon="['fas', 'question-circle']"
						:fixed-width="true"
					/>
				</label>
				<div class="control">
					<input
						v-model="karaoke.data.year"
						class="input short"
						type="number"
						min="1800"
						:max="new Date().getFullYear()"
					>
					<p
						v-if="!karaoke.data.year"
						class="help is-danger"
					>
						{{ t('kara.import.year_required') }}
					</p>
					<p
						v-if="karaoke.data.year && (karaoke.data.year < 1800 || karaoke.data.year > new Date().getFullYear())"
						class="help is-danger"
					>
						{{ t('kara.import.year_invalid') }}
					</p>
				</div>
			</div>
		</div>
		<label class="title">{{ t('kara.import.sections.categorization') }}</label>
		<div class="box">
			<div class="field">
				<label class="label">{{ t('kara.tagtypes.collections', karaoke.data.tags.collections.length) }}</label>
				<div class="control">
					<editable-tag-group
						:checkboxes="true"
						:tag-type="16"
						:params="karaoke.data.tags.collections"
						@change="(tags) => karaoke.data.tags.collections = tags"
					/>
				</div>
				<p
					v-if="karaoke.data.tags.collections.length === 0"
					class="help is-danger"
				>
					{{ t('kara.import.collections_required') }}
				</p>
			</div>
			<div class="field">
				<label class="label">{{ t('kara.tagtypes.families', karaoke.data.tags.families.length) }}</label>
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
				<label class="label">{{ t('kara.tagtypes.platforms', karaoke.data.tags.platforms.length) }}</label>
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
				<label class="label">{{ t('kara.tagtypes.genres', karaoke.data.tags.genres.length) }}</label>
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
				<label class="label">{{ t('kara.tagtypes.origins', karaoke.data.tags.origins.length) }}</label>
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
				<label class="label">{{ t('kara.tagtypes.misc', karaoke.data.tags.misc.length) }}</label>
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
				<label class="label">{{ t('kara.tagtypes.warnings', karaoke.data.tags.warnings.length) }}</label>
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
				<label
					class="label"
					:title="t('kara.import.groups_tooltip')"
				>
					{{ t('kara.tagtypes.groups', karaoke.data.tags.groups.length) }}
					<font-awesome-icon
						:icon="['fas', 'question-circle']"
						:fixed-width="true"
					/>
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
			<label class="title">{{ t('kara.import.sections.meta') }}</label>
			<div class="box">
				<div class="field">
					<label
						class="label"
						:title="t('kara.import.authors_tooltip')"
					>
						{{ t('kara.authors_by') }}
						<font-awesome-icon
							:icon="['fas', 'question-circle']"
							:fixed-width="true"
						/>
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
							{{ t('kara.import.authors_required') }}
						</p>
					</div>
				</div>
				<div class="field">
					<label
						class="label"
						:title="t('kara.import.comment_tooltip')"
					>
						{{ t('kara.import.comment') }}
						<font-awesome-icon
							:icon="['fas', 'question-circle']"
							:fixed-width="true"
						/>
					</label>
					<div class="control">
						<input
							v-model="karaoke.data.comment"
							class="input"
							type="text"
						>
					</div>
				</div>
				<div class="field">
					<label class="label">{{ t('kara.import.created_at') }}</label>
					<div class="control">
						<input
							class="input is-static"
							type="text"
							readonly
							:value="karaoke.data.created_at ? new Date(karaoke.data.created_at).toLocaleString() : null"
						>
					</div>
				</div>
				<div
					v-if="loggedIn"
					class="field"
				>
					<label for="contact">
						<input
							id="contact"
							v-model="sendContactInfos"
							type="checkbox"
						>
						{{ t('kara.import.send_contact_infos') }}
					</label>
				</div>
				<div
					v-if="!loggedIn"
					class="field"
				>
					<label
						class="label"
						:title="t('kara.import.contact_infos_tooltip')"
					>
						{{ t('kara.import.contact_infos') }}
						<font-awesome-icon
							:icon="['fas', 'question-circle']"
							:fixed-width="true"
						/>
					</label>
					<div class="control">
						<input
							v-model="contactInfos"
							class="input"
							type="text"
						>
						<label>{{ t('kara.import.auto_send_contact_infos') }}</label>
					</div>
				</div>
				<div class="field">
					<div class="control submit">
						<button
							class="button is-link"
							:class="{'is-loading': loading}"
							:disabled="submitDisabled()"
							@click="submit"
						>
							{{ t('kara.import.submit') }}
						</button>
						<span
							v-if="!subfile && !subfile_error"
							class="help is-warning"
						>{{ t('kara.import.lyrics_file_missing') }}</span>
					</div>
				</div>
				<div
					class="modal"
					:class="{'is-active': gitlabUrl}"
				>
					<div class="modal-background" />
					<div class="modal-card">
						<header class="modal-card-head">
							<p class="modal-card-title">
								{{ t('kara.import.add_success') }}
							</p>
							<nuxt-link
								class="delete"
								aria-label="close"
								@click.prevent="reset"
							/>
						</header>
						<i18n-t
							keypath="kara.import.add_success_description"
							tag="section"
							class="modal-card-body"
						>
							<template #url>
								<nuxt-link
									:href="gitlabUrl"
									target="_blank"
								>
									{{ gitlabUrl }}
								</nuxt-link>
							</template>
						</i18n-t>
						<footer class="modal-card-foot">
							<button
								class="button is-success"
								@click.prevent="reset"
							>
								{{ t('kara.import.restart') }}
							</button>
						</footer>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import _ from 'lodash';

	import { KaraList, MediaInfo } from '%/lib/types/kara';
	import { DBKara } from '%/lib/types/database/kara';
	import { useAuthStore } from '~/store/auth';
	import { useLocalStorageStore } from '~/store/localStorage';
	import { storeToRefs } from 'pinia';

	const props = defineProps<{
		kara?: DBKara
	}>();

	const karaoke = ref(convertDBKaraToKaraFile(props.kara));
	const mediafile = ref('');
	const subfile = ref('');
	const mediafile_error = ref('');
	const subfile_error = ref('');
	const gitlabUrl = ref('');
	const loading = ref(false);
	const uploading_media = ref<number | boolean>(false);
	const uploading_sub = ref<number | boolean>(false);
	const contactInfos = ref('');
	const currentParent = ref<{ label: string; value: string }>();
	const parents = ref<{ label: string; value: string }[]>([]);
	const karaSearch = ref<{ label: string; value: string }[]>([]);

	const debouncedGetAsyncData = ref();
	const mediafileInput = ref<HTMLInputElement>();
	const subfileInput = ref<HTMLInputElement>();

	const conf = useRuntimeConfig();
	const supportedLyrics = conf.public.SUPPORTED_LYRICS;
	const supportedMedias = conf.public.SUPPORTED_MEDIAS;
	const instanceName = conf.public.INSTANCE_NAME;

	const { params } = useRoute();
	const { push } = useRouter();

	const { sendContactInfos } = storeToRefs(useLocalStorageStore());
	const { setSendContactInfos } = useLocalStorageStore();
	const { loggedIn, user } = storeToRefs(useAuthStore());
	const { t } = useI18n();

	onMounted(async () => {
		debouncedGetAsyncData.value = _.debounce(getAsyncData, 500, { leading: true, trailing: true, maxWait: 750 });
	});

	async function getAsyncData(val: string) {
		const res = await useCustomFetch<KaraList>('/api/karas/search',
			{
				params: {
					filter: val,
					size: 50,
					ignoreCollections: true
				}
			});
		if (res.content) {
			karaSearch.value = res.content
				.filter(k => k.kid !== props.kara?.kid)
				.filter(k => !props.kara || !k.parents.includes(props.kara?.kid))
				.map(k => {
					return {
						label: buildKaraTitle(k, res.i18n),
						value: k.kid,
					};
				});
		}
	}

	getParents();

	async function getParents() {
		if (props.kara?.parents && props.kara?.parents?.length > 0) {
			const res = await useCustomFetch<KaraList>('/api/karas/search',
				{
					params: {
						q: `k:${props.kara?.parents.join()}`,
						ignoreCollections: true
					}
				});
			parents.value = res.content.map((kara: DBKara) => {
				return {
					label: buildKaraTitle(kara, res.i18n),
					value: kara.kid
				};
			});
		}
	}

	function onParentKaraChange(event: { label: string; value: string }) {
		if (event?.value) {
			applyFieldsFromKara(event.value);
			parents.value?.push(event);
		}
	}
	async function applyFieldsFromKara(kid: string) {
		const karas = await useCustomFetch<KaraList>(
			'/api/karas/search/',
			{
				params: {
					q: `k:${kid}`,
					size: 1,
					ignoreCollections: true
				}
			}
		);
		// Check if user has already started doing input, or if it's an edit of existing kara
		if (
			karas.content.length > 0 &&
			karas.content[0].kid === kid &&
			!props.kara?.kid &&
			karaoke.value?.data.tags.series.length === 0 &&
			karaoke.value?.data.tags.langs.length === 0 &&
			karaoke.value?.data.tags.versions.length === 0 &&
			Object.keys(karaoke.value?.data?.titles).length === 0
		) {
			karas.content[0].kid = '';
			const actualMedias = karaoke.value.medias;
			karaoke.value = convertDBKaraToKaraFile(karas.content[0]);
			karaoke.value.medias = actualMedias;
		}
	}

	function submitDisabled(): boolean {
		return Boolean(
			(!params.id && !mediafile) ||
				mediafile_error.value.length > 0 ||
				subfile_error.value.length > 0 ||
				!karaoke.value.data.titles ||
				Object.keys(karaoke.value.data.titles).length === 0 ||
				Object.values(karaoke.value.data.titles).includes('') ||
				!karaoke.value.data.titles_default_language ||
				(karaoke.value.data.tags.series?.length === 0 &&
					karaoke.value.data.tags.singergroups?.length === 0 &&
					karaoke.value.data.tags.singers?.length === 0) ||
				karaoke.value.data.tags.songtypes.length === 0 ||
				karaoke.value.data.tags.langs.length === 0 ||
				karaoke.value.data.tags.collections.length === 0 ||
				!karaoke.value.data.year ||
				karaoke.value.data.year < 1800 ||
				karaoke.value.data.year > new Date().getFullYear() ||
				(karaoke.value.data.songorder || 0) > 999 ||
				karaoke.value.data.tags.authors?.length === 0 ||
				uploading_media.value ||
				uploading_sub.value ||
				loading.value
		);
	}
	function onTitlesChange(titles: Record<string, string>) {
		karaoke.value.data.titles = titles;
	}
	function onDefaultLanguageSelect(defaultLanguage: string) {
		karaoke.value.data.titles_default_language = defaultLanguage;
	}
	async function handleMediafileUpload() {
		if (mediafileInput.value?.files?.length !== 0) {
			// @ts-ignore: sisi y'a eu un typecheck en haut, ta gueule mtn :)
			const file = mediafileInput.value?.files[0];
			mediafile_error.value = '';
			if (file && !isSupportedMediaFile(file.name) && isMediaFile(file.type)) {
				mediafile_error.value = t(
					'kara.import.add_file_media_not_supported_error',
					{
						name: file?.name,
						formats: supportedMedias.join(', ')
					}
				) as string;
			} else if (!file || !isSupportedMediaFile(file.name)) {
				mediafile_error.value = t(
					'kara.import.add_file_media_error',
					{
						name: file?.name
					}
				) as string;
			} else {
				mediafile.value = file.name;
				uploading_media.value = true;
				mediafile_error.value = '';	
				const formData = new FormData();
				formData.append('file', file);
				useUploadFile(
					'api/karas/importMedia',
					formData,
					(progressEvent: ProgressEvent<EventTarget>) => {
						uploading_media.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
					},
					(result: MediaInfo) => {
						karaoke.value.medias = [{
							version: determineVersion(karaoke.value.data.titles, karaoke.value.data.titles_default_language),
							filename: result.filename,
							audiogain: result.gain,
							loudnorm: result.loudnorm,
							filesize: Number(result.size),
							duration: result.duration,
							default: true,
							lyrics: karaoke.value.medias[0].lyrics || []
						}];
						uploading_media.value = false;
					}
				);
			}
		}
	}
	async function handleSubfileUpload() {
		if (subfileInput.value?.files?.length !== 0) {
			// @ts-ignore: sisi y'a eu un typecheck en haut, ta gueule mtn :)
			const file = subfileInput.value?.files[0];
			mediafile_error.value = '';
			if (!file || !isSupportedLyricsFile(file.name)) {
				subfile_error.value = t(
					'kara.import.add_file_lyrics_error',
					{
						name: file?.name
					}
				) as string;
			} else {
				subfile.value = file.name;
				uploading_sub.value = true;
				subfile_error.value = '';
				const formData = new FormData();
				formData.append('file', file);
				useUploadFile(
					'api/karas/importSub',
					formData,
					(progressEvent: ProgressEvent<EventTarget>) => {
						uploading_sub.value = Math.round((progressEvent.loaded * 100) / progressEvent.total);
					},
					(result: string) => {
						karaoke.value.medias[0].lyrics = [{
							filename: result,
							default: true,
							version: 'Default'
						}];
						uploading_sub.value = false;
					}
				);
			}
		}
	}
	function isMediaFile(type: string) {
		return /^(audio)|(video)\/.+$/.test(type);
	}
	function isSupportedMediaFile(filename: string) {
		return new RegExp(
			`^.+\\.(${supportedMedias.join('|')})$`
		).test(filename);
	}
	function isSupportedLyricsFile(filename: string) {
		return new RegExp(
			`^.+\\.(${supportedLyrics.join('|')})$`
		).test(filename);
	}
	function submit() {
		loading.value = true;
		let contact: string = '';
		if (loggedIn.value && sendContactInfos) {
			contact = `${user?.value?.login}@${instanceName}`;
			setSendContactInfos(true);
		} else if (!loggedIn.value) {
			contact = contactInfos.value;
		} else {
			setSendContactInfos(false);
		}
		const karaokeElem = _.cloneDeep(karaoke.value);
		for (const tag of Object.keys(karaokeElem.data.tags)) {
			// @ts-ignore: Object.keys type inference is bad hot take
			if (tag in karaokeElem.data.tags && karaokeElem.data.tags[tag].length === 0) {
				// @ts-ignore
				delete karaokeElem.data.tags[tag];
			}
		}
		if (params.id) {
			useCustomFetch<{data : string }>(
				`/api/karas/${karaokeElem.data.kid}`,
				{
					method: 'PUT',
					body: {
						kara: karaokeElem,
						modifiedMedia: !!mediafile,
						modifiedLyrics: !!subfile,
						contact
					}
				}
			).then((res) => {
				gitlabUrl.value = res.data;
			}).finally(() => {
				loading.value = false;
			});
		} else {
			useCustomFetch<{data : string }>(
				'/api/karas/',
				{
					method: 'POST',
					body: {
						kara: karaokeElem,
						contact
					}
				}
			).then((res) => {
				gitlabUrl.value = res.data;
			}).finally(() => {
				loading.value = false;
			});
		}
	}
	function reset() {
		if (params.id) {
			push('/import');
		} else {
			karaoke.value = convertDBKaraToKaraFile();
			mediafile.value = '';
			subfile.value = '';
			mediafile_error.value = '';
			subfile_error.value = '';
			gitlabUrl.value = '';
			mediafileInput.value = undefined;
			subfileInput.value = undefined;
		}
	}
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

	.box {
		background-color: transparent;
		border-top: 1px #5e6d6f solid;
		border-top-left-radius: 0;
		border-top-right-radius: 0;
	}
</style>
