import { getState } from '../../utils/state';

export const getLang = (req: any, _, next: any) => {
	const langs = req.get('accept-language');
	langs ?	req.lang = langs.split(',')[0].substring(0,2) : req.lang = getState().defaultLocale;
	next();
};
