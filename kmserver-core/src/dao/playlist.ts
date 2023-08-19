import { pg as yesql } from 'yesql';

import { buildClauses, db, transaction } from '../lib/dao/database.js';
import { WhereClause } from '../lib/types/database.js';
import { DBPL, DBPLC, DBPLCBase, PLCInsert } from '../lib/types/database/playlist.js';
import { PLCParams, PLParams } from '../lib/types/playlist.js';
import logger from '../lib/utils/logger.js';
import { makeKaraPretty } from './kara.js';
import * as sql from './sqls/playlist.js';

const service = 'PlaylistDAO';

export function updatePlaylist(pl: DBPL) {
	return db().query(yesql(sql.editPlaylist)(pl));
}

export async function truncatePlaylist(plaid: string) {
	await db().query(sql.truncatePlaylist, [plaid]);
}

export async function updatePLC(plc: DBPLCBase) {
	await db().query(yesql(sql.updatePLC)(plc));
}

export function insertPlaylist(pl: DBPL) {
	return db().query(yesql(sql.createPlaylist)(pl));
}

export function deletePlaylist(id: string) {
	return db().query(sql.deletePlaylist, [id]);
}

export function updatePlaylistKaraCount(id: string) {
	return db().query(sql.updatePlaylistKaraCount, [id]);
}

export function updatePlaylistLastEditTime(id: string) {
	return db().query(yesql(sql.updatePlaylistLastEditTime)({
		plaid: id,
		modified_at: new Date()
	}));
}

export function shiftPosInPlaylist(id: string, pos: number, shift: number) {
	return db().query(yesql(sql.shiftPosInPlaylist)({
		shift,
		plaid: id,
		pos
	}));
}

export async function getMaxPosInPlaylist(id: string): Promise<number> {
	const res = await db().query(sql.getMaxPosInPlaylist, [id]);
	return res.rows[0]?.maxpos;
}

export function reorderPlaylist(id: string) {
	return db().query(sql.reorderPlaylist, [id]);
}

export function setPos(plc_id: number, pos: number) {
	return db().query(sql.updatePLCSetPos, [
		pos,
		plc_id
	]);
}

export function updatePlaylistDuration(id: string) {
	return db().query(sql.updatePlaylistDuration, [id]);
}

export async function selectPLCMini(plcid: number) {
	const res = await db().query(sql.selectPLCMini, [plcid]);
	return res.rows[0];
}

export async function selectPlaylists(params: PLParams): Promise<DBPL[]> {
	const filterClauses: WhereClause = params.filter
		? buildClauses(params.filter, null, null, 'playlists')
		: {sql: [], params: {}, additionalFrom: []};
	const yesqlPayload = {
		sql: [...filterClauses.sql],
		params: {...filterClauses.params}
	};
	const whereClauses = ['TRUE'];
	const joinClauses = [];
	if (params.username) {
		params.includeUserAsContributor
			? whereClauses.push(` (p.fk_login = '${params.username}' OR pco.fk_login = '${params.username}') `)
			: whereClauses.push(` p.fk_login = '${params.username}' `);
	}
	if (params.plaid) {
		whereClauses.push(` p.pk_plaid = '${params.plaid}' `);
	}
	if (params.slug) {
		whereClauses.push(` p.slug = '${params.slug}' `);
	}
	if (params.containsKID) {
		joinClauses.push('LEFT JOIN playlist_content pc ON pc.fk_plaid = p.pk_plaid');
		whereClauses.push(` pc.fk_kid = '${params.containsKID}'`);
	}
	const query = sql.selectPlaylists(joinClauses, whereClauses, filterClauses.sql, filterClauses.additionalFrom.join(''));
	const res = await db().query(
		yesql(query)(yesqlPayload.params)
	);
	return res.rows;
}

export async function selectPlaylistContents(params: PLCParams): Promise<DBPLC[]> {
	const filterClauses: WhereClause = params.filter
		? buildClauses(params.filter, true)
		: { sql: [], params: {}, additionalFrom: [] };
	let limitClause = '';
	let offsetClause = '';
	let orderClause = 'pc.pos';
	if (params.from > 0) offsetClause = `OFFSET ${params.from} `;
	if (params.size > 0) limitClause = `LIMIT ${params.size} `;
	if (+params.random > 0) {
		limitClause = ` LIMIT ${+params.random}`;
		orderClause = 'RANDOM()';
	}
	const query = sql.selectPlaylistContents(
		filterClauses.sql,
		orderClause,
		limitClause,
		offsetClause,
		filterClauses.additionalFrom.join('')
	);
	const res = await db().query(
		yesql(query)({
			plaid: params.plaid,
			username: params.username,
			...filterClauses.params,
		})
	);
	return res.rows.map(row => makeKaraPretty(row) as DBPLC);
}

export async function insertContributor(plaid: string, username: string) {
	await db().query(sql.insertContributor, [plaid, username]);
}

export async function deleteContributor(plaid: string, username: string) {
	await db().query(sql.deleteContributor, [plaid, username]);
}

export async function insertKaraIntoPlaylist(karaList: PLCInsert[]): Promise<DBPLCBase[]> {
	const karas: any[] = karaList.map(kara => [
		kara.plaid,
		kara.username,
		kara.nickname,
		kara.kid,
		kara.added_at || new Date(),
		kara.pos,
		kara.flag_free || false,
		kara.flag_visible,
		kara.flag_refused || false,
		kara.flag_accepted || false
	]);
	return transaction({ params: karas, sql: sql.addKaraToPlaylist });
}

export function deleteKaraFromPlaylist(karas: number[]) {
	return db().query(sql.removeKaraFromPlaylist, [karas]);
}

export async function updatePlaylistSearchVector(username?: string) {
	logger.info(`Updating playlist search vector for ${username || 'all'}`, { service });
	const params = [];
	if (username) params.push(username);
	await db().query(sql.updatePlaylistSearchVector(username), params);
}
