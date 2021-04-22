import { pg as yesql } from 'yesql';
import { sqladdKaraToPlaylist, sqlcreatePlaylist, sqldeletePlaylist, sqleditPlaylist, sqlupdatePlaylistKaraCount, sqlupdatePlaylistLastEditTime, sqlshiftPosInPlaylist, sqlgetMaxPosInPlaylist, sqlreorderPlaylist, sqlupdatePLCSetPos, sqlupdatePlaylistDuration, sqlselectPLCMini, sqlgetPlaylistContents, sqlselectPlaylists, sqlremoveKaraFromPlaylist, sqlupdatePLC, sqltruncatePL, sqlinsertContributor, sqldeleteContributor } from './sqls/playlist';
import { buildClauses, db, transaction } from '../lib/dao/database';
import { DBPL, DBPLCAfterInsert, DBPLCBase } from '../lib/types/database/playlist';
import { PLC, PLCParams, PLParams } from '../lib/types/playlist';
import { WhereClause } from '../lib/types/database';

export function updatePlaylist(pl: DBPL) {
	return db().query(yesql(sqleditPlaylist)(pl));
}

export async function truncatePlaylist(plaid: string) {
	await db().query(sqltruncatePL, [plaid]);
}

export async function updatePLC(plc: DBPLCBase) {
	await db().query(yesql(sqlupdatePLC)(plc));
}

export function insertPlaylist(pl: DBPL) {
	return db().query(yesql(sqlcreatePlaylist)(pl));
}

export function deletePlaylist(id: string) {
	return db().query(sqldeletePlaylist, [id]);
}

export function updatePlaylistKaraCount(id: string) {
	return db().query(sqlupdatePlaylistKaraCount, [id]);
}

export function updatePlaylistLastEditTime(id: string) {
	return db().query(yesql(sqlupdatePlaylistLastEditTime)({
		plaid: id,
		modified_at: new Date()
	}));
}

export function shiftPosInPlaylist(id: string, pos: number, shift: number) {
	return db().query(yesql(sqlshiftPosInPlaylist)({
		shift: shift,
		playlist_id: id,
		pos: pos
	}));
}

export async function getMaxPosInPlaylist(id: string): Promise<number> {
	const res = await db().query(sqlgetMaxPosInPlaylist, [id]);
	return res.rows[0]?.maxpos;
}

export function reorderPlaylist(id: string) {
	return db().query(sqlreorderPlaylist, [id]);
}

export function setPos(plc_id: number, pos: number) {
	return db().query(sqlupdatePLCSetPos, [
		pos,
		plc_id
	]);
}

export function updatePlaylistDuration(id: string) {
	return db().query(sqlupdatePlaylistDuration, [id]);
}

export async function selectPLCMini(plcid: number) {
	const res = await db().query(sqlselectPLCMini, [plcid]);
	return res.rows[0];
}

export async function selectPlaylistContents(params: PLCParams): Promise<DBPLCBase[]> {
	const filterClauses: WhereClause = params.filter ? buildClauses(params.filter, true) : {sql: [], params: {}, additionalFrom: []};
	let limitClause = '';
	let offsetClause = '';
	let orderClause = 'pc.pos';
	let whereClause = '';
	if (params.from > 0) offsetClause = `OFFSET ${params.from} `;
	if (params.size > 0) limitClause = `LIMIT ${params.size} `;
	const query = sqlgetPlaylistContents(filterClauses.sql, whereClause, orderClause, limitClause, offsetClause,
		filterClauses.additionalFrom.join(''));
	const res = await db().query(yesql(query)({
		plaid: params.plaid,
		username: params.username,
		...filterClauses.params
	}));
	return res.rows;
}

export async function selectPlaylists(params: PLParams): Promise<DBPL[]> {
	let whereClauses = [' 1 = 1 '];
	let joinClauses = [];
	if (params.public) {
		whereClauses.push(' p.flag_visible_online = TRUE ');
	}
	if (params.username) {
		params.contributors
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
		joinClauses.push('LEFT JOIN playlists_content pc ON pc.fk_plaid = p.plaid');
		whereClauses.push(` pc.fk_kid = ${params.containsKID}`);
	}
	const res = await db().query(sqlselectPlaylists(joinClauses, whereClauses));
	return res.rows;
}

export async function insertContributor(plaid: string, username: string) {
	await db().query(sqlinsertContributor, [plaid, username]);
}

export async function deleteContributor(plaid: string, username: string) {
	await db().query(sqldeleteContributor, [plaid, username]);
}

export async function insertKaraIntoPlaylist(karaList: PLC[]): Promise<DBPLCAfterInsert[]> {
	if (karaList.length > 1) {
		const karas: any[] = karaList.map(kara => ([
			kara.plaid,
			kara.username,
			kara.nickname,
			kara.kid,
			kara.created_at,
			kara.pos,
			kara.flag_visible || true,
			kara.flag_refused || false,
			kara.flag_accepted || false
		]));
		const res = await transaction({params: karas, sql: sqladdKaraToPlaylist});
		return res;
	} else {
		const kara = karaList[0];
		const res = await db().query(sqladdKaraToPlaylist, [
			kara.plaid,
			kara.username,
			kara.nickname,
			kara.kid,
			kara.created_at,
			kara.pos,
			false,
			kara.flag_visible,
			kara.flag_refused || false,
			kara.flag_accepted || false
		]);
		return res.rows;
	}
}

export function deleteKaraFromPlaylist(karas: number[]) {
	return db().query(sqlremoveKaraFromPlaylist, [karas]);
}
