import validate from 'validate.js';
import testJSON from 'is-valid-json';
import {has as hasLang} from 'langs';
import {uuidRegexp, karaTypes, tags} from '../services/constants';

function typeValidator(value: string) {
	if (!karaTypes[value]) return `${value} is an invalid song type`;
	return null;
}

function arrayValidator(value: string) {
	if (!Array.isArray(value)) return `${value} is not an array`;
	return null;
}

function arrayNoCommaValidator(value: string[]) {
	if (!Array.isArray(value)) return `${value} is not an array`;
	value = value.map((value) => value.trim());
	for (const elem of value) {
		if (elem.includes(',')) return `'${value}' contains an element with a comma (${elem})`;
	}
	return null;
}

function integerValidator(value: any) {
	if (value) {
		if (!isNaN(value)) return null;
		return ` '${value}' is invalid`;
	}
	return null;
}

function langValidator(value: any) {
	if (!Array.isArray(value)) value = value.split(',');
	value = value.map((value: string) => value.trim());

	const firstInvalidLang = value.find((lang: string) => !(lang === 'und' || lang === 'mul' || lang === 'zxx' || hasLang('2B', lang)));
	if (firstInvalidLang) return `'${firstInvalidLang}' is invalid ISO639-2B code`;

	return null;
}

function tagsValidator(value: any) {
	if (!Array.isArray(value)) value = value.split(',');
	value = value.map((value: string) => value.trim());

	const firstInvalidTag = value.find((tag: string) => !tags.includes(tag.replace(/TAG_/,'')));
	if (firstInvalidTag) return `list '${firstInvalidTag}' is invalid (not a known tag)`;

	return null;
}


function boolIntValidator(value: number) {
	if (value && +value !== 0 && +value !== 1) return ` '${value}' is invalid`;
	return null;
}

function isJSON(value: any) {
	if (testJSON(value)) return null;
	return ` '${value}' is invalid JSON`;
}

function isNumber(value: any) {
	return !isNaN(value);
}

function numbersArrayValidator(value: any) {
	if (value) {
		value = '' + value;
		if (value.includes(',')) {
			const array = value.split(',');
			if (array.every(isNumber)) return null;
			return ` '${value}' is invalid`;
		}
		if (!isNaN(value)) return null;
		return ` '${value}' is invalid`;
	}
	return ` '${value}' is invalid`;
}


function seriesAliasesValidator(value: any) {
	if (!value) return null;
	if (!Array.isArray(value)) return ` '${value}' is invalid (not an array)`;
	return null;
}

function songItemValidator(value: any) {
	if (!value) return ` '${value} is not present`;
	if (!Array.isArray(value)) return ` '${value}' is invalid (not an array)`;
	const uuid = new RegExp(uuidRegexp);
	for (const item of value) {
		if (!uuid.test(item.kid)) return ` '${value} is invalid (not a valid KID)`;
		// Need more tests
	}
	return null;
}

function favoritesValidator(value: any) {
	if (!value) return ` '${value} is not present`;
	if (!Array.isArray(value)) return ` '${value}' is invalid (not an array)`;
	const uuid = new RegExp(uuidRegexp);
	for (const item of value) {
		if (!uuid.test(item.kid)) return ` '${value} is invalid (not a valid KID)`;
	}
	return null;
}

// Sanitizers

export function unescape(str: string) {
	return str
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, '\'')
		.replace(/&#x3A;/g, ':')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}

function seriesi18nValidator(value: any) {
	if (typeof value !== 'object') return `i18n data (${value}) is not an object`;
	for (const lang of Object.keys(value)) {
		if (!(lang === 'zxx' || lang === 'und' || lang === 'mul' || hasLang('2B', lang))) {
			return `i18n data invalid : '${lang}' is an invalid ISO639-2B code`;
		}
	}
	return null;
}


// Init

export function initValidators() {
	validate.validators.boolIntValidator = boolIntValidator;
	validate.validators.numbersArrayValidator = numbersArrayValidator;
	validate.validators.integerValidator = integerValidator;
	validate.validators.isJSON = isJSON;
	validate.validators.langValidator = langValidator;
	validate.validators.seriesi18nValidator = seriesi18nValidator;
	validate.validators.seriesAliasesValidator = seriesAliasesValidator;
	validate.validators.songItemValidator = songItemValidator;
	validate.validators.favoritesValidator = favoritesValidator;
	validate.validators.arrayNoCommaValidator = arrayNoCommaValidator;
	validate.validators.tagsValidator = tagsValidator;
	validate.validators.typeValidator = typeValidator;
	validate.validators.arrayValidator = arrayValidator;
}

export function check(obj: any, constraints: any) {
	initValidators();
	return validate(obj, constraints);
}

