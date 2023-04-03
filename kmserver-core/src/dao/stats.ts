import {db, transaction} from '../lib/dao/database.js';
import { Instance, Played, Requested, Session } from '../types/stats.js';
import * as sql from './sqls/stats.js';

export async function upsertInstance(i: Instance) {
	return db().query(sql.upsertInstance, [
		new Date(),
		i.instance_id,
		i.version,
		i.locale,
		i.screens,
		i.cpu_manufacturer,
		i.cpu_model,
		i.cpu_speed,
		i.cpu_cores,
		i.memory,
		i.total_disk_size,
		i.os_platform,
		i.os_distro,
		i.os_release,
		JSON.stringify(i.config)
	]);
}

export async function upsertPlayed(viewcounts: Played[]) {
	const params = viewcounts.map(v => [
		v.kid,
		v.seid,
		v.played_at
	]);
	if (viewcounts.length > 0) await transaction({sql: sql.insertViewcount, params});
}

export async function wipeInstance(instance_id: string) {
	return db().query(sql.wipeInstance, [instance_id]);
}

export async function upsertSessions(instance_id: string, sessions: Session[]) {
	const params = sessions.map(s => [
		instance_id,
		s.seid,
		s.started_at,
		s.name,
		s.ended_at || null
	]);
	if (sessions.length > 0) await transaction({sql: sql.insertSession, params});
}

export async function upsertRequests(requests: Requested[]) {
	const params = requests.map(r => [
		r.kid,
		r.seid,
		r.requested_at
	]);
	if (requests.length > 0) await transaction({sql: sql.insertRequested, params});
}
