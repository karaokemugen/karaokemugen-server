import { i18n } from '../i18n'
import isoLanguages from "@cospired/i18n-iso-languages";
isoLanguages.registerLocale(require("@cospired/i18n-iso-languages/langs/en.json"));
isoLanguages.registerLocale(require("@cospired/i18n-iso-languages/langs/fr.json"));

export default function(code,current_language){
	var r = null;
	if(code==="iso3")
	{
		r =  isoLanguages.alpha2ToAlpha3T(current_language);
		if(r==='fra')
			return 'fre';
		return r;
	}
	else
	{
		if(code==='und')
			return i18n.t("tag:language.und");
		else if(code==='zxx')
			return i18n.t("tag:language.zxx");

		r = isoLanguages.getName(code, current_language)
		if(r && r.length)
			return r;
		return code;
	}
}