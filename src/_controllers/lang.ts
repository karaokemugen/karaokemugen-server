import {getConfig} from '../_utils/config';

export const getLang = (req, _, next) => {
	const langs = req.get('accept-language');
	langs ?	req.lang = langs.split(',')[0].substring(0,2) : req.lang = getConfig().locale;
	next();
};
