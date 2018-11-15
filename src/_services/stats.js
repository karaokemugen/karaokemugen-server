import { uuidRegexp } from './constants';
import testJSON from 'is-valid-json';
import { check } from '../_utils/validators';
import { upsertInstance, replaceFavorites, upsertViewcounts, upsertRequests } from '../_dao/stats';

const payloadConstraints = {
	'instance.instance_id': {presence: true, format: uuidRegexp},
	'instance.version': {presence: {allowEmpty: false }},
	'instance.config': {presence: {allowEmpty: false }}
};

export async function processStatsPayload(payload) {
	if (!testJSON(payload)) throw 'Syntax error in JSON data';
	console.log(payload);
	const validationErrors = check(payload, payloadConstraints);
	if (validationErrors) throw `Payload is not valid: ${JSON.stringify(validationErrors)}`;
	await Promise.all([
		upsertInstance(payload.instance),
		replaceFavorites(payload.instance.instance_id, payload.favorites),
		upsertViewcounts(payload.instance.instance_id, payload.viewcounts),
		upsertRequests(payload.instance.instance_id, payload.requests)
	]);
}
