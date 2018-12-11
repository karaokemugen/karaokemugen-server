module.exports = {
    options: {
        debug: false,
        plural : true,
        removeUnusedKeys:true,
        func: {
            list: ['i18next.t', 'i18n.t'],
            extensions: ['.js']
        },
        lngs: ['en','fr'],
        ns: [
            'message',
            'map',
            'karadownloader',
        ],
        defaultLng: 'en',
        defaultNs: 'message',
        defaultValue: null,
        resource: {
            loadPath: 'src/i18n/{{lng}}/{{ns}}.json',
            savePath: 'src/i18n/{{lng}}/{{ns}}.json',
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