import {langSelector, db, transaction, buildClauses} from '../lib/dao/database';
import {pg as yesql} from 'yesql';
import { Favorite, Played, Requested, Instance } from '../types/stats';
const sql = require('./sqls/stats');

export async function upsertInstance(i: Instance) {
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

export async function replaceFavorites(instance_id: string, favorites: Favorite[]) {
	await db().query(sql.deleteFavorites, [instance_id]);
	const params = favorites.map(f => [instance_id, f.kid]);
	if (favorites.length > 0) await transaction([{sql: sql.insertFavorite, params: params}]);
}

export async function upsertPlayed(instance_id: string, viewcounts: Played[]) {
	const params = viewcounts.map(v => [
		instance_id,
		v.kid,
		v.session_started_at,
		v.played_at
	]);
	if (viewcounts.length > 0) await transaction([{sql: sql.insertViewcount, params: params}]);
}

export async function upsertRequests(instance_id: string, requests: Requested[]) {
	const params = requests.map(r => [
		instance_id,
		r.kid,
		r.session_started_at,
		r.requested_at
	]);
	if (requests.length > 0) await transaction([{sql: sql.insertRequested, params: params}]);
}

export async function getPlayedStats(filter?: string, lang?: string, from = 0, size = 0) {
	const filterClauses = filter ? buildClauses(filter) : {sql: [], params: {}};
	let limitClause = '';
	let offsetClause = '';
	if (from > 0) offsetClause = `OFFSET ${from} `;
	if (size > 0) limitClause = `LIMIT ${size} `;
	const query = sql.getPlayedStats(filterClauses.sql, langSelector(lang), limitClause, offsetClause);
	const res = await db().query(yesql(query)(filterClauses.params));
	return res.rows;
}

export async function getFavoritesStats(filter?: string, lang?: string, from = 0, size = 0) {
	const filterClauses = filter ? buildClauses(filter) : {sql: [], params: {}};
	let limitClause = '';
	let offsetClause = '';
	if (from > 0) offsetClause = `OFFSET ${from} `;
	if (size > 0) limitClause = `LIMIT ${size} `;
	const query = sql.getFavoritesStats(filterClauses.sql, langSelector(lang), limitClause, offsetClause);
	const res = await db().query(yesql(query)(filterClauses.params));
	return res.rows;
}

export async function getRequestedStats(filter?: string, lang?: string, from = 0, size = 0) {
	const filterClauses = filter ? buildClauses(filter) : {sql: [], params: {}};
	let limitClause = '';
	let offsetClause = '';
	if (from > 0) offsetClause = `OFFSET ${from} `;
	if (size > 0) limitClause = `LIMIT ${size} `;
	const query = sql.getRequestedStats(filterClauses.sql, langSelector(lang), limitClause, offsetClause);
	const res = await db().query(yesql(query)(filterClauses.params));
	return res.rows;
}
