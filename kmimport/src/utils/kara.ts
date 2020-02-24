import langs from 'langs';
import Axios from 'axios';

var navigatorLanguage;
let apiUrl;

function getNavigatorLanguage() {
	var languages = langs.all();
	var index = 0;
	while (!navigatorLanguage && index < languages.length) {
		if (navigator.languages[0].substring(0, 2) === languages[index]['1']) {
			navigatorLanguage = languages[index]['2B'];
		}
		index++;
	}
	return navigatorLanguage;
}
navigatorLanguage = getNavigatorLanguage();

export function getTagInLocale(champ) {
	return champ.i18n[navigatorLanguage] ? champ.i18n[navigatorLanguage] : champ.i18n['eng'];
}

export function getTagInLocaleList(i18n, list) {
	if (list) {
		return list.map(champ => {
			return i18n[champ.tid][navigatorLanguage] ? i18n[champ.tid][navigatorLanguage] : i18n[champ.tid]['eng'];
		});
	} else {
		return [];
	} 
}

export function getNameTagInLocaleList(list) {
	if (list) {
		return list.map(champ => {
			return getTagInLocale(champ);
		});
	} else {
		return [];
	} 
}

export async function setApiUrl () {
	if (!apiUrl) {
		const response = await Axios.get('/whereIsMyAPI');
		apiUrl = `${response.data.Secure ? 'https://' : 'http://'}${response.data.Host}:${response.data.Port}`
	}
	return apiUrl;
}

export function getApiUrl () {
	return apiUrl;
}