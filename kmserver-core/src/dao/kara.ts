import {buildTypeClauses, buildClauses, db} from '../lib/dao/database';
import {pg as yesql} from 'yesql';
import {Kara, KaraParams} from '../lib/types/kara';
import { DBKara, DBYear, DBMedia } from '../lib/types/database/kara';
import { DBStats } from '../types/database/kara';
import { WhereClause } from '../lib/types/database';
import sql = require('./sqls/kara');
import logger from '../lib/utils/logger';

export async function selectAllMedias(): Promise<DBMedia[]> {
	const res = await db().query(sql.selectAllMedias);
	return res.rows;
}

export async function selectAllYears(): Promise<DBYear[]> {
	const res = await db().query(sql.getYears);
	return res.rows;
}

export async function selectAllKaras(params: KaraParams, includeStaging = false): Promise<DBKara[]> {
	const filterClauses: WhereClause = params.filter
		? buildClauses(params.filter)
		: {sql: [], params: {}, additionalFrom: []};
	let typeClauses = params.q
		? buildTypeClauses(params.q, params.order)
		: {sql: [], params: {}, additionalFrom: []};
	const yesqlPayload = {
		sql: [...filterClauses.sql, ...typeClauses.sql],
		params: {...filterClauses.params, ...typeClauses.params},
		additionalFrom: [...filterClauses.additionalFrom, ...typeClauses.additionalFrom]
	};
	let orderClauses = '';
	let limitClause = '';
	let offsetClause = '';
	let selectClause = '';
	let joinClause = '';
	let groupClause = '';
	let whereClauses = '';
	if (params.username) {
		selectClause = `
			(CASE WHEN f.fk_kid IS NULL
				THEN FALSE
				ELSE TRUE
			END) as flag_favorites,
			`;
		joinClause = 'LEFT OUTER JOIN users_favorites AS f ON f.fk_login = :username AND f.fk_kid = ak.pk_kid';
		groupClause = 'f.fk_kid, ';
		yesqlPayload.params.username = params.username;
	}
	if (params.favorites) {
		joinClause += ' LEFT JOIN users_favorites AS fv ON fv.fk_kid = ak.pk_kid';
		yesqlPayload.params.username_favs = params.favorites;
		whereClauses = 'AND fv.fk_login = :username_favs';
	}
	if (params.order === 'recent') orderClauses = 'created_at DESC, ';
	if (params.order === 'played') {
		whereClauses += ' AND ks.played > 1';
		orderClauses = 'ks.played DESC, ';
		selectClause += 'ks.played,';
		groupClause += 'ks.played, ';
		joinClause += ' LEFT OUTER JOIN kara_stats ks ON ks.fk_kid = ak.pk_kid ';
	}
	if (params.order === 'favorited') {
		whereClauses += ' AND ks.favorited > 1';
		orderClauses = 'ks.favorited DESC, ';
		selectClause += 'ks.favorited,';
		groupClause += 'ks.favorited, ';
		joinClause += ' LEFT OUTER JOIN kara_stats ks ON ks.fk_kid = ak.pk_kid ';
	}
	if (params.order === 'requested') {
		whereClauses += ' AND ks.requested > 1';
		orderClauses = 'ks.requested DESC, ';
		selectClause += 'ks.requested,';
		groupClause += 'ks.requested, ';
		joinClause += ' LEFT OUTER JOIN kara_stats ks ON ks.fk_kid = ak.pk_kid ';
	}
	if (params.from > 0) offsetClause = `OFFSET ${params.from} `;
	if (params.size > 0) limitClause = `LIMIT ${params.size} `;
	// If we're asking for random songs, here we modify the query to get them.
	if (params.random > 0) {
		orderClauses = `RANDOM(), ${orderClauses}`;
		limitClause = `LIMIT ${params.random}`;
	}
	const query = sql.getAllKaras(
		yesqlPayload.sql,
		orderClauses,
		limitClause,
		offsetClause,
		selectClause,
		joinClause,
		groupClause,
		whereClauses,
		yesqlPayload.additionalFrom,
		includeStaging
	);
	const res = await db().query(yesql(query)(yesqlPayload.params));
	return res.rows;
}

export async function insertKara(kara: Kara) {
	await db().query(
		yesql(sql.insertKara)({
			karafile: kara.karafile,
			mediafile: kara.mediafile,
			subfile: kara.subfile,
			titles: kara.titles,
			titles_aliases: JSON.stringify(kara.titles_aliases || []),
			year: kara.year,
			songorder: kara.songorder || null,
			duration: kara.duration,
			gain: kara.gain,
			loudnorm: kara.loudnorm,
			modified_at: kara.modified_at,
			created_at: kara.created_at,
			kid: kara.kid,
			repository: kara.repository,
			mediasize: kara.mediasize,
			download_status: 'DOWNLOADED',
			comment: kara.comment,
			ignoreHooks: kara.ignoreHooks || false,
		})
	);
}

export async function deleteKara(kids: string[]) {
	await db().query(sql.deleteKara, [kids]);
}

export async function selectBaseStats(): Promise<DBStats> {
	const res = await db().query(sql.selectBaseStats);
	return res.rows[0];
}

export async function refreshKaraStats() {
	logger.info('Refreshing kara stats', {service: 'DB'});
	return db().query(sql.refreshKaraStats);
}
