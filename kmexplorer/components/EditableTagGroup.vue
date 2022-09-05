<template>
	<div>
		<div v-if="checkboxes" class="tags">
			<label v-for="tag in data" :key="tag.tid" class="checkbox">
				<input v-model="values" type="checkbox" :value="tag" @change="check">
				{{ localizedName(tag) }}
			</label>
		</div>
		<div v-if="!checkboxes">
			<div class="tags">
				<span v-for="tag in values" :key="tag.tid" class="tag">
					{{ localizedName(tag) }}
					<a class="delete is-small" @click.prevent="() => deleteValue(tag)" />
				</span>
				<div class="button tag is-small" @click="inputVisible = true">
					<font-awesome-icon :icon="['fas', 'plus']" />
					{{ $t('kara.import.add') }}
				</div>
			</div>
			<div v-if="inputVisible">
				<b-autocomplete
					ref="input"
					v-model="currentVal"
					keep-first
					open-on-focus
					:data="data"
					:loading="isFetching"
					:custom-formatter="localizedName"
					:clear-on-select="true"
					@typing="debouncedGetAsyncData"
					@select="addValue"
				>
					<template v-if="!noCreate" #header>
						<button
							class="button"
							:class="{'is-loading': loading}"
							:disabled="currentVal.length === 0"
							@click="newValue"
						>
							<font-awesome-icon :icon="['fas', 'plus']" />
							<span>{{ $t('kara.import.create') }}</span>
						</button>
					</template>
				</b-autocomplete>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import { debounce } from 'lodash';
	import { alpha2ToAlpha3B } from '@karaokemugen/i18n-iso-languages';
	import { DBTagMini } from '%/lib/types/database/tag';
	import { KaraTag } from '%/lib/types/kara';

	interface VState {
		data: DBTagMini[],
		values: DBTagMini[],
		inputVisible: boolean,
		currentVal: string,
		isFetching: boolean,
		loading: boolean,
		debouncedGetAsyncData?: Function
	}

	export default Vue.extend({
		name: 'EditableTagGroup',

		props: {
			checkboxes: {
				type: Boolean
			},
			tagType: {
				type: Number,
				required: true
			},
			params: {
				type: Array
			} as PropOptions<string[]>,
			noCreate: {
				type: Boolean,
				default: false
			}
		},

		data(): VState {
			return {
				data: [],
				values: [],
				inputVisible: false,
				currentVal: '',
				isFetching: false,
				loading: false
			};
		},

		watch: {
			params(now) {
				// Process resets
				if (now.length === 0) {
					this.values = [];
				}
			},
			inputVisible(now) {
				if (now) {
					this.$nextTick(() => {
						(this.$refs.input as any).$refs.input.$refs.input.focus();
					});
				}
			},
			values(now, old) {
				if (old.length !== 0 || now.length !== 0) {
					this.$emit('change', now.map((t: DBTagMini) => t.tid));
				}
			}
		},

		async mounted() {
			this.debouncedGetAsyncData = debounce(this.getAsyncData, 500, { leading: true, trailing: true, maxWait: 750 });
			if (this.checkboxes) {
				const result = await this.getTags(this.tagType);
				this.data = result.content;
			}
			if (this.params.length > 0) {
				const tags: DBTagMini[] = [];
				for (const tag of this.params) {
					const tag2 = this.data.find(val => val.tid === tag);
					if (tag2) {
						tags.push(tag2);
					} else {
						const tagInfo = await this.$axios.$get(`/api/karas/tags/${tag}`);
						if (!tagInfo) {
							throw new TypeError(`Tag ${tag} unknown`);
						}
						tags.push(tagInfo);
					}
				}
				this.values = tags;
			}
		},

		methods: {
			async getTags(type: number, filter?: string) {
				return await this.$axios.$get('/api/karas/tags', {
					params: {
						type,
						filter,
						includeStaging: true
					}
				});
			},
			getAsyncData(val: string) {
				this.isFetching = true;
				this.getTags(this.tagType, val)
					.then((result: {content: DBTagMini[]}) => {
						const tids = this.values.map(tag => tag.tid);
						this.data = result.content
							? result.content.filter(tag => !tids.includes(tag.tid)).sort((a, b) =>
								a.name.localeCompare(b.name)
							)
							: [];
					})
					.finally(() => {
						this.isFetching = false;
					});
			},
			localizedName(tag: DBTagMini) {
				if (tag.i18n) {
					return tag.i18n[alpha2ToAlpha3B(this.$i18n.locale) as string] || tag.i18n.eng || tag.name;
				} else {
					return tag.name;
				}
			},
			addValue(option: DBTagMini) {
				this.inputVisible = false;
				this.currentVal = '';
				if (option) {
					const values: DBTagMini[] = this.values;
					values.push(option);
					this.values = values;
				}
			},
			async newValue() {
				if (this.currentVal) {
					this.loading = true;
					const res: { tag: DBTagMini } = await this.$axios.$post('/api/tags/createStaging', {
						name: this.currentVal,
						types: [this.tagType],
						i18n: {
							eng: this.currentVal
						}
					}).finally(() => {
						this.loading = false;
					});
					this.addValue(res.tag);
				}
			},
			deleteValue(option: KaraTag) {
				this.values = this.values.filter(tag => tag.name !== option.name);
			},
			check() {
				this.values = this.data.filter(tag => this.values.some(tag2 => tag.tid === tag2.tid));
			}
		}
	});
</script>

<style scoped lang="scss">
	.checkbox {
		width: 250px;
	}
</style>
