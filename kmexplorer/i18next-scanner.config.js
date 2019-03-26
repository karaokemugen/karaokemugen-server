module.exports = {
    options: {
        debug: false,
        sort: true,
        plural : true,
        removeUnusedKeys:true,
        func: {
            list: ['i18next.t', 'this.props.t', 't'],
            extensions: ['.js']
        },
        trans: {
            component: 'Trans',
            i18nKey: 'i18nKey',
            defaultsKey: 'defaults',
            extensions: ['.js', '.jsx'],
            fallbackKey: function(ns, value) {
                // Returns a hash value as the fallback key
                return sha1(value);
            }
        },
        lngs: ['en','fr'],
        ns: [
            'common',
            'tag',
        ],
        defaultLng: 'en',
        defaultNs: 'common',
        defaultValue: null,
        resource: {
            loadPath: 'static/locales/{{lng}}/{{ns}}.json',
            savePath: 'static/locales/{{lng}}/{{ns}}.json',
            jsonIndent: 2,
            lineEnding: '\n'
        },
        nsSeparator: ':', // namespace separator
        keySeparator: '.', // key separator
        interpolation: {
            prefix: '{{',
            suffix: '}}'
        }
    }
};