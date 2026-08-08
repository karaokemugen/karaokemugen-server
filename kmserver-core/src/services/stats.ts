import z from 'zod';

import { refreshKaraStats } from '../dao/kara.js';
import {
	updateBanSession,
	upsertInstance,
	upsertPlayed,
	upsertRequests,
	upsertSessions,
	wipeInstance} from '../dao/stats.js';
import { JWTTokenWithRoles } from '../lib/types/user.js';
import { ErrorKM } from '../lib/utils/error.js';
import logger from '../lib/utils/logger.js';
import { check, testJSON, zBool, zInt, zJSON, zNonEmptyString, zUUID } from '../lib/utils/validators.js';
import { PlayedCacheItem } from '../types/stats.js';
import sentry from '../utils/sentry.js';

const service = 'Stats';

const statItemPlayedConstraints = z.object({
	kid: zUUID,
	seid: zUUID,
	played_at: z.iso.datetime()
});

const statItemRequestedConstraints = z.object({
	kid: zUUID,
	seid: zUUID,
	requested_at: z.iso.datetime()
});

const statItemSessionConstraints = z.object({
	seid: zUUID,
	name: zNonEmptyString,
	started_at: z.iso.datetime(),
	ended_at: z.iso.datetime(),
	played: zInt,
	requested: zInt,
	active: zBool,
	private: zBool,
});

const payloadConstraints = z.object({
	instance: z.object({
		instance_id: zUUID,
		version: zNonEmptyString,
		config: zJSON,
	}).loose(),
	viewcounts: z.array(statItemPlayedConstraints),
	requests: z.array(statItemRequestedConstraints),
	sessions: z.array(statItemSessionConstraints),
});

const playedCache: Map<string, PlayedCacheItem[]> = new Map();

export async function addPlayed(kid: string, ip: string, userToken?: JWTTokenWithRoles) {
	let played = playedCache.get(kid);
	try {
		if (!played) played = [];
		// Wipe entries older than one hour ago
		const date = new Date();
		played = played.filter(p => date.getTime() - p.timestamp.getTime() < (1000 * 60 * 60));
		
		if (userToken && played.find(p => p.fromUser === userToken.username)) return;
		if (played.find(p => p.fromIP === ip && p.fromUser === userToken?.username)) return;
		
		played.push({
			fromIP: ip,
			fromUser: userToken?.username,
			timestamp: date
		});
		await upsertPlayed([{
			kid,
			seid: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
			played_at: date
		}]);
	} catch (err) {
		logger.error(`Unable to add played stat for ${kid}`, { service });
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	} finally {
		playedCache.set(kid, played);
	}
}

export async function processStatsPayload(payload: any) {
	try {
		if (!testJSON(payload)) throw new ErrorKM('Syntax error in JSON data', 400);

		// Payloads before version 3 are ignored
		if (payload.payloadVersion < 3) return;

		const validationErrors = check(payload, payloadConstraints);
		if (validationErrors) throw new ErrorKM(`Payload is not valid: ${JSON.stringify(validationErrors)}`, 400, false);
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
