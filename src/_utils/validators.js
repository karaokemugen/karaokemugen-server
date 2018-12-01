import validate from 'validate.js';
import testJSON from 'is-valid-json';
import {has as hasLang} from 'langs';
import {uuidRegexp} from '../_services/constants';

function integerValidator(value) {
	if (value) {
		if (!isNaN(value)) return null;
		return ` '${value}' is invalid`;
	}
	return null;
}

function langValidator(value) {
	const langs = value.replace('"', '').split(',');
	let result = null;
	for (const lang of langs) {
		if (!(lang === 'zxx' || lang === 'und' || lang === 'mul' || hasLang('2B', lang))) {
			result = `'${lang}' is invalid`;
			break;
		}
	}
	return result;
}

function boolIntValidator(value) {
	if (value && +value !== 0 && +value !== 1) return ` '${value}' is invalid`;
	return null;
}

function isJSON(value) {
	if (testJSON(value)) return null;
	return ` '${value}' is invalid JSON`;
}

function isNumber(value) {
	return !isNaN(value);
}

function numbersArrayValidator(value) {
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


function seriesAliasesValidator(value) {
	if (!value) return null;
	if (!Array.isArray(value)) return ` '${value}' is invalid (not an array)`;
	return null;
}

function songItemValidator(value) {
	if (!value) return ` '${value} is not present`;
	if (!Array.isArray(value)) return ` '${value}' is invalid (not an array)`;
	const uuid = new RegExp(uuidRegexp);
	for (const item of value) {
		if (!uuid.test(item.kid)) return ` '${value} is invalid (not a valid KID)`;
		if (item.requested_at && isNaN(+item.requested_at)) return ` '${value} is invalid (not a valid requested_at time)`;
		if (item.modified_at && isNaN(item.modified_at)) return ` '${value} is invalid (not a valid modified_at time)`;
		if (isNaN(item.session_started_at)) return ` '${value} is invalid (not a valid session_started_at time)`;
	}
	return null;
}

function favoritesValidator(value) {
	if (!value) return ` '${value} is not present`;
	if (!Array.isArray(value)) return ` '${value}' is invalid (not an array)`;
	const uuid = new RegExp(uuidRegexp);
	for (const item of value) {
		if (!uuid.test(item.kid)) return ` '${value} is invalid (not a valid KID)`;
	}
	return null;
}

// Sanitizers

export function unescape(str) {
	return str
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, '\'')
		.replace(/&#x3A;/g, ':')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&amp;/g, '&');
}

function seriesi18nValidator(value) {
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
	if (!validate.validators.boolIntValidator) validate.validators.boolIntValidator = boolIntValidator;
	if (!validate.validators.numbersArrayValidator) validate.validators.numbersArrayValidator = numbersArrayValidator;
	if (!validate.validators.integerValidator) validate.validators.integerValidator = integerValidator;
	if (!validate.validators.isJSON) validate.validators.isJSON = isJSON;
	if (!validate.validators.langValidator) validate.validators.langValidator = langValidator;
	if (!validate.validators.seriesi18nValidator) validate.validators.seriesi18nValidator = seriesi18nValidator;
	if (!validate.validators.seriesAliasesValidator) validate.validators.seriesAliasesValidator = seriesAliasesValidator;
	if (!validate.validators.songItemValidator) validate.validators.songItemValidator = songItemValidator;
	if (!validate.validators.favoritesValidator) validate.validators.favoritesValidator = favoritesValidator;
}

export function check(obj, constraints) {
	initValidators();
	return validate(obj, constraints);
}

