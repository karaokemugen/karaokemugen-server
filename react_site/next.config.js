const withSass = require('@zeit/next-sass')

// default DEV settings
var BASE_URL = '/base';
var API_URL = 'http://localhost:1350';

var mode = 'dev';
if(process.argv.indexOf('--mode=kms')>=0)
	mode = 'kms';
if(process.argv.indexOf('--mode=kma')>=0)
	mode = 'kma';

switch(mode) {
	case "kms": // karaokemugen server environment
		BASE_URL = '/base';
		API_URL = 'http://localhost:1350';
		break;
	case "kma": // karaokemugen app environment
		BASE_URL = '/base';
		API_URL = 'http://localhost:1350';
		break;
}

module.exports = withSass({
	assetPrefix: BASE_URL,
	publicRuntimeConfig: { // Will be available on both server and client
		BASE_URL: BASE_URL,
		API_URL: API_URL,
	},
})