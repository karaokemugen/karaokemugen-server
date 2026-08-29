import type { DBUser } from '~/../kmserver-core/src/lib/types/database/user';
import type { TokenResponseWithRoles } from '~/../kmserver-core/src/lib/types/user';
import { useCustomFetch } from '~/composables/useCustomFetch';

export const useAuthStore = defineStore('auth', {
	state: (): { loggedIn: boolean, token?: string, user?: DBUser } => {
		return {
			loggedIn: false,
			token: undefined,
			user: undefined
		};
	},
	getters: {},
	actions: {
		async setToken(token: string) {
			this.token = token;
			this.user = await useCustomFetch<DBUser>('/api/myaccount', undefined, true, this);
		},
		async login(tokenResponse: TokenResponseWithRoles) {
			if (tokenResponse.token) this.token = tokenResponse.token;
			const userTemp = { roles: tokenResponse.roles, nickname: tokenResponse.username };
			const res = await useCustomFetch<DBUser>('/api/myaccount', undefined, true, this);
			this.user = { ...userTemp, ...res};
			this.loggedIn = true;
		},
		logout() {
			this.token = undefined;
			this.user = undefined;
			this.loggedIn = false;
		},
		updateUser(user: DBUser) {
			this.user = user;
		}
	},
	persist: {
		storage: piniaPluginPersistedstate.localStorage()
	}
});
