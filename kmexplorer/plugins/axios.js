export default function({ $axios, app }) {
    $axios.onResponse(res => {
        if (res.data.code && typeof res.data.data !== 'object') {
            app.$toast.success(app.$t(`toast.${res.data.code}`));
        }
    });
    $axios.onError(err => {
        if (err.response.data.code && typeof err.response.data.data !== 'object') {
            app.$toast.error(app.$t(`toast.${err.response.data.code}`));
        }
    });
}