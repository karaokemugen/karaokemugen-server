import testJSON from 'is-valid-json';

import { refreshKaraStats } from '../dao/kara.js';
import {
	updateBanSession,
	upsertInstance,
	upsertPlayed,
	upsertRequests,
	upsertSessions,
	wipeInstance} from '../dao/stats.js';
import { uuidRegexp } from '../lib/utils/constants.js';
import logger from '../lib/utils/logger.js';
import { check } from '../lib/utils/validators.js';
import sentry from '../utils/sentry.js';

const service = 'Stats';

const payloadConstraints = {
	'instance.instance_id': {presence: true, format: uuidRegexp},
	'instance.version': {presence: {allowEmpty: false }},
	'instance.config': {presence: {allowEmpty: false }},
	viewcounts: {songItemValidator: true},
	requests: {songItemValidator: true},
	sessions: {sessionValidator: true}
};

export async function addPlayed(seid: string, kid: string, played_at: string) {
	try {
		const date = new Date(played_at);
		await upsertPlayed([{
			kid,
			seid,
			played_at: date
		}]);
	} catch (err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	}
}

export async function processStatsPayload(payload: any) {
	try {
		if (!testJSON(payload)) throw 'Syntax error in JSON data';

		// Payloads before version 3 are ignored
		if (payload.payloadVersion < 3) return;

		const validationErrors = check(payload, payloadConstraints);
		if (validationErrors) throw `Payload is not valid: ${JSON.stringify(validationErrors)}`;
		await wipeInstance(payload.instance.instance_id);
		await upsertInstance(payload.instance);
		await upsertSessions(payload.instance.instance_id, payload.sessions);
		await Promise.all([
			upsertPlayed(payload.viewcounts),
			upsertRequests(payload.requests)
		]);
		logger.info(`Received payload from instance ${payload.instance.instance_id}`, {service});
	} catch (err) {
		logger.error(`Error with payload from ${payload?.instance?.instance_id}`, {service, obj: err});
		logger.debug('Payload in error', {service, obj: payload});
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	}
}

export async function banSession(seid: string, banned: boolean) {
	logger.info(`${!banned ? 'De-' : ''}Banning session ${seid}`, { service });
	await updateBanSession(seid, banned);
	refreshKaraStats();
}
