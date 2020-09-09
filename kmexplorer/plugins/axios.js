export default function ({ $axios, app }) {
	$axios.onResponse((res) => {
		if (res?.data?.code) { // if no code is present don't display toast
			app.$toast.success(app.i18n.t(`toast.${res.data.code}`));
		}
	});
	$axios.onError((err) => {
		if (err?.response.data?.code) { // if no code is present don't display toast
			app.$toast.error(app.i18n.t(`toast.${err.response.data.code}`), { icon: 'error' });
		}
		if (err?.response?.data === 'Token has expired') {
			app.$auth.logout();
		}
	});
}
