import {db, transaction} from './database';
const sql = require('./sqls/stats');

export async function upsertInstance(i) {
	return await db().query(sql.upsertInstance, [
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

export async function replaceFavorites(instance_id, favorites) {
	await db().query(sql.deleteFavorites, [instance_id]);
	const params = [];
	favorites.forEach(f => params.push([instance_id, f.kid]));
	if (favorites.length > 0) await transaction([{sql: sql.insertFavorite, params: params}]);
}

export async function upsertPlayed(instance_id, viewcounts) {
	const params = [];
	viewcounts.forEach(v => params.push([
		instance_id,
		v.kid,
		new Date(v.session_started_at * 1000),
		new Date(v.modified_at * 1000)
	]));
	if (viewcounts.length > 0) await transaction([{sql: sql.insertViewcount, params: params}]);
}

export async function upsertRequests(instance_id, requests) {
	const params = [];
	requests.forEach(r => params.push([
		instance_id,
		r.kid,
		new Date(r.session_started_at * 1000),
		new Date(r.requested_at * 1000)
	]));
	if (requests.length > 0) await transaction([{sql: sql.insertRequested, params: params}]);
}

export async function getFavoritesStats() {
	return await db().query(sql.getFavoritesStats);
}

export async function getRequestedStats() {
	return await db().query(sql.getRequestedStats);
}

export async function getPlayedStats() {
	return await db().query(sql.getPlayedStats);
}