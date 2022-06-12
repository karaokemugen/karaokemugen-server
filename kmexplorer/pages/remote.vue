<template>
	<b-table :data="data">
		<b-table-column v-slot="props" field="token" :label="$t('remote.token')" searchable>
			{{ props.row.token }}
		</b-table-column>
		<b-table-column v-slot="props" field="code" :label="$t('remote.code')" searchable>
			<input v-model="props.row.code" class="input" type="text" @keydown.enter="promoteToken(props.row)">
		</b-table-column>
		<b-table-column v-slot="props" field="last_ip" :label="$t('remote.last_ip')" searchable>
			{{ props.row.last_ip }}
		</b-table-column>
		<b-table-column v-slot="props" field="last_use" :label="$t('remote.last_use')" searchable>
			{{ props.row.last_use }}
		</b-table-column>
		<b-table-column v-slot="props" field="permanent" :label="$t('remote.permanent')" searchable :custom-search="searchPermanent">
			<input type="checkbox" disabled :checked="props.row.permanent">
		</b-table-column>
		<b-table-column v-slot="props">
			<button
				class="button"
				@click="removeToken(props.row.token)"
			>
				<font-awesome-icon :icon="['fas', 'trash']" />
				<span>{{ $t('remote.delete_button') }}</span>
			</button>
		</b-table-column>
	</b-table>
</template>

<script lang="ts">
	import Vue from 'vue';

	import { RemoteAccessToken } from '%/lib/types/remote';

	interface VState {
		data: RemoteAccessToken[]
	}

	export default Vue.extend({
		name: 'RemoteList',

		data(): VState {
			return {
				data: []
			};
		},

		async fetch() {
			const res = await this.$axios
				.get<RemoteAccessToken[]>('/api/remote')
				.catch(_err =>
					this.$nuxt.error({ statusCode: 404, message: this.$t('error.remote') as string })
				);
			this.data = res ? res.data : [];
		},

		methods: {
			async removeToken(token: string) {
				try {
					await this.$axios.delete(`/api/remote/${token}`);
					this.$fetch();
				} catch (e) {
					this.$toast.error(this.$t('remote.delete_error') as string, { icon: 'error' });
				}
			},
			async promoteToken(remote: RemoteAccessToken) {
				try {
					await this.$axios.put('/api/remote/promote', { token: remote.token, code: remote.code });
					this.$toast.success(this.$t('remote.edit_success') as string);
					this.$fetch();
				} catch (e) {
					this.$toast.error(this.$t('remote.edit_error') as string, { icon: 'error' });
				}
			},
			searchPermanent(remote: RemoteAccessToken, input: string) {
				let inputBool: Boolean | undefined;
				if (input === 'true') {
					inputBool = true;
				} else if (input === 'false') {
					inputBool = false;
				}
				return inputBool === undefined || remote.permanent === inputBool;
			}
		}
	});
</script>
