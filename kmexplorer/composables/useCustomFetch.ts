import { NitroFetchRequest } from 'nitropack';
import { FetchOptions } from 'ofetch';
import * as Toast from 'vue-toastification';
import { useAuthStore } from '~/store/auth';

// @ts-ignore
const useToast = Toast.useToast ?? Toast.default.useToast;

export const useCustomFetch = <T = unknown, R extends NitroFetchRequest = NitroFetchRequest> (request: R, opts?: FetchOptions) => {
	const toast = useToast();
	const auth = useAuthStore();
	return $fetch<T, R>(request, {
		baseURL: useNuxtApp().$config.API_URL,
		headers: {
			authorization: auth.token || '',
			...opts?.headers
		},
		...opts,
		onResponse({ request, response, options }) {
			if (response._data?.code && response.ok) { // if no code is present don't display toast
				toast.success(useNuxtApp().$i18n.t(`toast.${response._data.code}`));
			}
		},
		onResponseError({ request, response, options }) {
			if (response._data?.code && !response.ok) { // if no code is present don't display toast
				toast.error(useNuxtApp().$i18n.t(`toast.${response._data.code}`), { icon: 'error' });
			}
			if (response._data === 'Token has expired' || response._data === 'User logged in unknown') {
				auth.logout();
			}
		}
	});
};
