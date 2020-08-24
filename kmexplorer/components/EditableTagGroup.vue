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
					<div class="delete is-small" @click="() => deleteValue(tag)" />
				</span>
				<div class="button tag is-small" @click="inputVisible = true">
					<font-awesome-icon :icon="['fas', 'plus']" />
					{{ $t('kara.import.add') }}
				</div>
			</div>
			<div v-if="inputVisible">
				<b-autocomplete
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
					<template slot="header">
						<a class="button" @click="newValue">
							<font-awesome-icon :icon="['fas', 'plus']" />
							<span>{{ $t('kara.import.create') }}</span>
						</a>
					</template>
				</b-autocomplete>
			</div>
		</div>
	</div>
</template>

<script lang="ts">
	import Vue, { PropOptions } from 'vue';
	import debounce from 'lodash/debounce';
	import { DBTagMini } from '%/lib/types/database/tag';
	import { KaraTag } from '%/lib/types/kara';

	interface VState {
		data: DBTagMini[],
		values: DBTagMini[],
		inputVisible: boolean,
		currentVal: string,
		isFetching: boolean
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
			} as PropOptions<DBTagMini[]>
		},

		data(): VState {
			return {
				data: [],
				values: this.params,
				inputVisible: false,
				currentVal: '',
				isFetching: false
			};
		},

		async mounted() {
			this.debouncedGetAsyncData = debounce(this.getAsyncData, 500);
			if (this.checkboxes) {
				const result = await this.getTags(this.tagType);
				this.data = result.content;
			}
		},

		methods: {
			async getTags(type: number, filter?: string) {
				return await this.$axios.$get(`/api/karas/tags/${type}`, {
					params: {
						type,
						filter
					}
				});
			},
			getAsyncData(val: string) {
				this.isFetching = true;
				this.getTags(this.tagType, val)
					.then((result) => {
						this.data = this.sortByProp(result.content || [], 'name');
					})
					.finally(() => {
						this.isFetching = false;
					});
			},
			localizedName(tag: DBTagMini) {
				if (tag.i18n) {
					return tag.i18n[this.$i18n.locale] || tag.i18n.eng || tag.name;
				} else {
					return tag.name;
				}
			},
			sortByProp(array: any[], val: string) {
				return array.sort((a, b) => {
					return a[val] > b[val] ? 1 : a[val] < b[val] ? -1 : 0;
				});
			},
			addValue(option: DBTagMini) {
				this.inputVisible = false;
				if (option) {
					const values: DBTagMini[] = this.values;
					values.push(option);
					this.$emit('change', values);
				}
			},
			newValue() {
				if (this.currentVal) {
					// @ts-ignore: Oh ta gueule hein, c'est magique !
					// Petit KaraTag deviendra grand DBTag une fois l'issue publiée
					this.addValue({ name: this.currentVal });
				}
			},
			deleteValue(option: KaraTag) {
				this.values = this.values.filter(tag => tag.name !== option.name);
				this.$emit('change', this.values);
			},
			check() {
				this.$emit(
					'change',
					this.data.filter(tag => this.values.some(tag2 => tag.tid === tag2.tid))
				);
			}
		}
	});
</script>

<style scoped lang="scss">
	.checkbox {
		width: 250px;
	}

	a.dropdown-item:hover, .dropdown .dropdown-menu .has-link a:hover, button.dropdown-item:hover {
		color: unset;
	}
</style>
