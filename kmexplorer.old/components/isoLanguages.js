import isoLanguages from "@cospired/i18n-iso-languages";
isoLanguages.registerLocale(require("@cospired/i18n-iso-languages/langs/en.json"));
isoLanguages.registerLocale(require("@cospired/i18n-iso-languages/langs/fr.json"));

export default function(current_language){
	var r = null;
	r =  isoLanguages.alpha2ToAlpha3T(current_language);
	if(r==='fra')
		return 'fre';
	return r;
}