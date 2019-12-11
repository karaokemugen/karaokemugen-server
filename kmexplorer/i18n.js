const NextI18Next = require('next-i18next').default

module.exports = new NextI18Next({
	defaultLanguage: 'en',
	otherLanguages: ['fr'],
	localeSubpaths: false,
	debug: false,
	returnNull:false, // null is not a valid translation
	returnEmptyString:true, // empty string is a valid translation
	defaultNS:'common',
	nsSeparator:':',
	keySeparator:'.',
	appendNamespaceToMissingKey:true,
})
