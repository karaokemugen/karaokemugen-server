import countries from 'i18n-iso-countries';
import enCountries from 'i18n-iso-countries/langs/en.json';
import frCountries from 'i18n-iso-countries/langs/fr.json';
import idCountries from 'i18n-iso-countries/langs/id.json';
import deCountries from 'i18n-iso-countries/langs/de.json';
import ptCountries from 'i18n-iso-countries/langs/pt.json';

countries.registerLocale(enCountries);
countries.registerLocale(frCountries);
countries.registerLocale(idCountries);
countries.registerLocale(deCountries);
countries.registerLocale(ptCountries);

export function getListCountriesInLocale(userLang:string) {
	const result = [];
	if (process.client) {
		const alphaCodes = Object.keys(countries.getAlpha2Codes());
		for (const alphaCode of alphaCodes) {
			result.push({ value: alphaCode, label: getCountriesInLocaleFromCode(alphaCode, userLang) });
		}
	}
	return result;
}

export function getCountriesInLocaleFromCode(code: string, userLang:string) {
	return countries.getName(code, userLang) || '';
}

export function getCountryCode(name:string, userLang:string): string {
	for (const country of getListCountriesInLocale(userLang)) {
		if (country.label === name) {
			return country.value;
		}
	}
	return '';
}

export function listCountries(name: string, userLang:string) {
	const listCountries: string[] = [];
	for (const country of getListCountriesInLocale(userLang)) {
		listCountries.push(country.label);
	}
	return listCountries.filter(value =>
		!value.toLowerCase().includes(name.toLowerCase()));
}
