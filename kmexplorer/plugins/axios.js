export default function({ $axios, app }) {
    $axios.onResponse(res => {
        console.log('test', res);
        if (res.data.code && typeof res.data.data !== 'object') { // ?
            app.$toast.success(app.i18n.t(`toast.${res.data.code}`));
        }
    });
    $axios.onError(err => {
        console.warn('test', err.response);
        if (err.response.data.code && typeof err.response.data.data !== 'object') { // ?
            app.$toast.error(app.i18n.t(`toast.${err.response.data.code}`));
        }
    });
}