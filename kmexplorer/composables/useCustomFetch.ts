import type { AvailableRouterMethod, NitroFetchRequest } from 'nitropack';
import { FetchResult, UseFetchOptions } from 'nuxt/app';
import { KeysOf } from 'nuxt/dist/app/composables/asyncData';
import type { FetchError } from 'ofetch';
import { FetchOptions } from 'ofetch';
import type { Ref } from 'vue';
import * as Toast from 'vue-toastification';
import { useAuthStore } from '~/store/auth';

// @ts-ignore
const useToast = Toast.useToast ?? Toast.default.useToast;

export const useCustomFetchAsync = <
	ResT = void,
	DefaultT = null,
	ErrorT = FetchError,
	ReqT extends NitroFetchRequest = NitroFetchRequest,
	Method extends AvailableRouterMethod<ReqT> = ResT extends void
	? 'get' extends AvailableRouterMethod<ReqT>
	? 'get'
	: AvailableRouterMethod<ReqT>
	: AvailableRouterMethod<ReqT>,
	_ResT = ResT extends void ? FetchResult<ReqT, Method> : ResT,
	DataT = _ResT,
	PickKeys extends KeysOf<DataT> = KeysOf<DataT>
>(
		request: Ref<ReqT> | ReqT | (() => ReqT),
		opts?: UseFetchOptions<_ResT, DataT, PickKeys, DefaultT, ReqT, Method>
	) => {
	const toast = useToast();
	const auth = useAuthStore();
	const nuxt = useNuxtApp();
	return useFetch<ResT, ErrorT, ReqT, Method, _ResT, DataT, PickKeys, DefaultT>(request, {
		baseURL: nuxt.$config.public.API_URL,
		headers: {
			authorization: auth.token || '',
			...opts?.headers,
		},
		lazy: true,
		...opts,
		onResponse({ request, response, options }) {
			if (response._data?.code && response.ok) { // if no code is present don't display toast
				toast.success(nuxt.$i18n.t(`toast.${response._data.code}`));
			}
		},
		onResponseError({ request, response, options }) {
			if (response._data?.code && !response.ok) { // if no code is present don't display toast
				toast.error(nuxt.$i18n.t(`toast.${response._data.code}`), { icon: 'error' });
			}
			if (response._data === 'Token has expired' || response._data === 'User logged in unknown') {
				auth.logout();
			}
		}
	});
};

export const useCustomFetch = <T = unknown, R extends NitroFetchRequest = NitroFetchRequest>(
	request: R,
	opts?: FetchOptions
) => {
	const toast = useToast();
	const auth = useAuthStore();
	const nuxt = useNuxtApp();
	return $fetch<T, R>(request, {
		baseURL: nuxt.$config.public.API_URL,
		headers: {
			authorization: auth.token || '',
			...opts?.headers
		},
		...opts,
		onResponse({ request, response, options }) {
			if (response._data?.code && response.ok) { // if no code is present don't display toast
				toast.success(nuxt.$i18n.t(`toast.${response._data.code}`));
			}
		},
		onResponseError({ request, response, options }) {
			if (response._data?.code && !response.ok) { // if no code is present don't display toast
				toast.error(nuxt.$i18n.t(`toast.${response._data.code}`), { icon: 'error' });
			}
			if (response._data === 'Token has expired' || response._data === 'User logged in unknown') {
				auth.logout();
			}
		}
	});
};
