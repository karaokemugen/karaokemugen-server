import {pg as yesql} from 'yesql';

import {buildClauses, buildTypeClauses, db, transaction} from '../lib/dao/database.js';
import { WhereClause } from '../lib/types/database.js';
import { DBKara, DBMedia, DBYear } from '../lib/types/database/kara.js';
import { DBPLC } from '../lib/types/database/playlist.js';
import {Kara, KaraFileV4, KaraParams} from '../lib/types/kara.js';
import {getConfig} from '../lib/utils/config.js';
import {getTagTypeName, tagTypes} from '../lib/utils/constants.js';
import logger from '../lib/utils/logger.js';
import { DBStats } from '../types/database/kara.js';
import { getHardsubsBeingProcessed } from '../utils/hardsubs.js';
import * as sql from './sqls/kara.js';

const service = 'DB';

export async function selectAllMedias(collections?: string[]): Promise<DBMedia[]> {
	const collectionsClauses = [];
	if (collections) for (const collection of collections) {
		collectionsClauses.push(`'${collection}~${tagTypes.collections}' = ANY(ak.tid)`);
	}
	const res = await db().query(sql.selectAllMedias(collectionsClauses));
	return res.rows;
}

export async function selectAllYears(params: { order: 'recent' | 'karacount', collections: string[] }): Promise<DBYear[]> {
	let orderClauses = 'year';
	if (params.order === 'karacount') orderClauses = `karacount DESC, ${orderClauses}`;
	const collectionsClauses = [];
	if (params.collections) for (const collection of params.collections) {
		collectionsClauses.push(`'${collection}~${tagTypes.collections}' = ANY(ak.tid)`);
	}
	const res = await db().query(sql.getYears(orderClauses, collectionsClauses));
	return res.rows;
}


function getKaraLineSortOrder(direction: 'asc' | 'desc' = 'asc'): { orderBy: string[]; groupBy: string[] } {
	const orderBy = [];
	const groupBy = [];
	const karaLineSort = getConfig().Frontend.Library.KaraLineSort;
	for (const e of karaLineSort) {
		if (typeof e === 'string' && Object.keys(tagTypes).includes(e)) {
			orderBy.push(`aks.${e} ${direction}`);
			groupBy.push(`aks.${e}`);
		} else if (Array.isArray(e)) {
			orderBy.push(`aks.${e.join('_')} ${direction}`);
			groupBy.push(`aks.${e.join('_')}`);
		} else if (e === 'title') {
			orderBy.push(`aks.titles ${direction}`);
			groupBy.push(`aks.titles`);
		}
	}
	return {
		orderBy,
		groupBy,
	};
}

function prepareKaraQuery(params: KaraParams) {
	params.direction = 'desc' as 'desc' | 'asc';
	const filterClauses: WhereClause = params.filter
		? buildClauses(params.filter)
		: {sql: [], params: {}, additionalFrom: []};
	const typeClauses = params.q
		? buildTypeClauses(params.q, params.order)
		: {sql: [], params: {}, additionalFrom: []};
	const q = {
		sql: [...filterClauses.sql, ...typeClauses.sql],
		params: {...filterClauses.params, ...typeClauses.params},
		additionalFrom: [...filterClauses.additionalFrom, ...typeClauses.additionalFrom],
		orderClauses: [],
		limitClause: '',
		offsetClause: '',
		selectClause: '',
		joinClause: '',
		groupClauses: [],
		fromClauses: [],
		whereClauses: [],
		withCTEs: ['blank AS (SELECT true)'],
		collectionClauses: []
	};
	if (params.username) {
		q.selectClause = `
			(CASE WHEN f.fk_kid IS NULL
				THEN FALSE
				ELSE TRUE
			END) as flag_favorites,
			f.favorited_at AS favorited_at,
			`;
		q.joinClause = 'LEFT OUTER JOIN users_favorites AS f ON f.fk_login = :username AND f.fk_kid = ak.pk_kid';
		q.groupClauses.push('f.fk_kid', 'f.favorited_at');
		q.params.username = params.username;
	}
	if (params.favorites) {
		q.joinClause += ' LEFT JOIN users_favorites AS fv ON fv.fk_kid = ak.pk_kid';
		q.params.username_favs = params.favorites;
		q.whereClauses.push('fv.fk_login = :username_favs');
	}
	if (params.safeOnly) {
		q.withCTEs.push(`warning_tags AS (SELECT array_agg(pk_tid || '~${tagTypes.warnings}') tid FROM tag t WHERE t.types @> ARRAY[${tagTypes.warnings}])`);
		q.fromClauses.push('warning_tags wt');
		q.whereClauses.push('(wt.tid IS NULL OR NOT wt.tid && ak.tid)');
	}
	if (params.userAnimeList) {
		q.withCTEs.push(
			'anime_list_infos AS (SELECT anime_list_ids, anime_list_to_fetch FROM users where users.pk_login = :username_anime_list)'
		);
		q.whereClauses.push(`(
			(SELECT anime_list_to_fetch FROM anime_list_infos) = 'myanimelist' AND myanimelist_ids::int[] && (SELECT anime_list_ids FROM anime_list_infos)
		OR (
			SELECT anime_list_to_fetch FROM anime_list_infos) = 'anilist' AND anilist_ids::int[] && (SELECT anime_list_ids FROM anime_list_infos)
		OR (
			SELECT anime_list_to_fetch FROM anime_list_infos) = 'kitsu' AND kitsu_ids::int[] && (SELECT anime_list_ids FROM anime_list_infos)
		)`);
		q.params.username_anime_list = params.userAnimeList;
	}
	if (params.order === 'recent') {
		q.orderClauses.push(`created_at ${params.direction === 'asc' ? '' : 'DESC'}`);
	 }else if (params.order === 'played') {
		q.orderClauses.push(`ks.played ${params.direction === 'asc' ? '' : 'DESC'} NULLS LAST`);
		q.selectClause += 'COALESCE(ks.played, 0) AS played,';
		q.groupClauses.push('ks.played');
		q.joinClause += ' LEFT OUTER JOIN kara_stats ks ON ks.fk_kid = ak.pk_kid ';
	} else if (params.order === 'playedRecently') {
		q.orderClauses.push(`ks.played_recently ${params.direction === 'asc' ? '' : 'DESC'} NULLS LAST`);
		q.selectClause += 'COALESCE(ks.played_recently, 0) AS played,';
		q.groupClauses.push('ks.played_recently');
		q.joinClause += ' LEFT OUTER JOIN kara_stats ks ON ks.fk_kid = ak.pk_kid ';
	} else if (params.order === 'user_favorites') {
		q.orderClauses.push(`f.favorited_at ${params.direction === 'asc' ? '' : 'DESC'} NULLS LAST`);
	} else if (params.order === 'favorited') {
		q.orderClauses.push(`ks.favorited ${params.direction === 'asc' ? '' : 'DESC'} NULLS LAST`);
		q.selectClause += 'COALESCE(ks.favorited, 0) AS favorited,';
		q.groupClauses.push('ks.favorited');
		q.joinClause += ' LEFT OUTER JOIN kara_stats ks ON ks.fk_kid = ak.pk_kid ';
	} else if (params.order === 'requested') {
		q.orderClauses.push(`ks.requested ${params.direction === 'asc' ? '' : 'DESC'} NULLS LAST`);
		q.selectClause += 'COALESCE(ks.requested, 0) AS requested,';
		q.groupClauses.push('ks.requested');
		q.joinClause += ' LEFT OUTER JOIN kara_stats ks ON ks.fk_kid = ak.pk_kid ';
	} else if (params.order === 'requestedRecently') {
		q.orderClauses.push(`ks.requested_recently ${params.direction === 'asc' ? '' : 'DESC'} NULLS LAST`);
		q.selectClause += 'COALESCE(ks.requested_recently, 0) AS requested,';
		q.groupClauses.push('ks.requested_recently');
		q.joinClause += ' LEFT OUTER JOIN kara_stats ks ON ks.fk_kid = ak.pk_kid ';
	} else {
		if (!params.random) {
			// Build order here from config, only if not random.
			params.direction = 'asc';
			const config = getKaraLineSortOrder(params.direction);
			q.orderClauses.push(...config.orderBy);
			q.groupClauses.push(...config.groupBy);
		}
	}
	// If we're asking for random songs, here we modify the query to get them. We reset orderBy here because RANDOM() make all other criterias useless.
	if (params.random > 0) {
		q.orderClauses = ['RANDOM()'];
		q.limitClause = `LIMIT ${params.random}`;
	}
	if (params.from > 0) q.offsetClause = `OFFSET ${params.from} `;
	if (params.size > 0) q.limitClause = `LIMIT ${params.size} `;

	if (!params.ignoreCollections) {
		for (const collection of (params.forceCollections || getConfig().Frontend.DefaultCollections) || []) {
			if (collection) q.collectionClauses.push(`'${collection}~${tagTypes.collections}' = ANY(ak.tid)`);
		}
	}

	q.fromClauses.push('all_karas AS ak');
	return q;
}

export async function selectAllKaras(params: KaraParams, includeStaging = false): Promise<DBKara[]> {
	const q = prepareKaraQuery(params);
	const query = sql.selectAllKaras(
		q.sql,
		q.orderClauses,
		q.limitClause,
		q.offsetClause,
		q.selectClause,
		q.joinClause,
		q.groupClauses,
		q.whereClauses,
		q.fromClauses,
		q.additionalFrom,
		includeStaging,
		q.collectionClauses,
		q.withCTEs,
		params.forPlayer,
		getHardsubsBeingProcessed(),
		params.random
	);
	const countQuery = sql.getAllKarasCount(
		q.sql,
		q.joinClause,
		q.whereClauses,
		q.fromClauses,
		q.additionalFrom,
		includeStaging,
		q.collectionClauses,
		q.withCTEs
	);
	const [res, resCount] = await Promise.all([
		db().query(yesql(query)(q.params)),
		db().query(yesql(countQuery)(q.params))
	]);
	if (res.rows?.length > 0 && res.rows[0] !== null) {
		res.rows[0].count = resCount.rows[0].count;
	}
	return res.rows.map(row => makeKaraPretty(row, params.forPlayer));
}

export function makeKaraPretty(row: any, forPlayer = false): DBKara | DBPLC {
	const { tags, ...rowWithoutTags } = row;
	delete row.dummy;
	for (const tagType of Object.keys(tagTypes)) {
		rowWithoutTags[tagType] = [];
	}
	if (!tags) {
		if (forPlayer) {
			return row;
		}
		return rowWithoutTags;
	}
	for (const tag of tags) {
		if (tag && tag?.type_in_kara) {
			const type = getTagTypeName(tag.type_in_kara);
			if (type) rowWithoutTags[type].push(tag);
		}
	}
	return rowWithoutTags;
}

export async function insertKara(kara: KaraFileV4) {
	await db().query(
		yesql(sql.insertKara)({
			karafile: kara.meta.karaFile,
			mediafile: kara.medias[0].filename,
			lyrics_infos: JSON.stringify(kara.medias[0].lyrics),
			titles: kara.data.titles,
			titles_aliases: JSON.stringify(kara.data.titles_aliases || []),
			titles_default_language: kara.data.titles_default_language || 'eng',
			year: kara.data.year,
			songorder: kara.data.songorder || null,
			duration: kara.medias[0].duration,
			loudnorm: kara.medias[0].loudnorm,
			modified_at: kara.data.modified_at,
			created_at: kara.data.created_at,
			kid: kara.data.kid,
			repository: kara.data.repository,
			mediasize: kara.medias[0].filesize,
			download_status: 'DOWNLOADED',
			comment: kara.data.comment,
			ignoreHooks: kara.data.ignoreHooks || false,
			from_display_type: kara.data.from_display_type,
			songname: kara.data.songname || null,
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
	try {
		logger.info('Refreshing kara stats', { service });
		logger.debug('Getting all stats from DB', { service });
		const [played, playedRecently, requested, requestedRecently, favorited] = await Promise.all([
			db().query(sql.refreshKaraStats.played),
			db().query(sql.refreshKaraStats.playedRecently),
			db().query(sql.refreshKaraStats.requested),
			db().query(sql.refreshKaraStats.requestedRecently),
			db().query(sql.refreshKaraStats.favorited)
		]);
		// Aggregate everything.
		logger.debug('Aggregating all stats in memory', { service });
		const statsMap: Map<string, { played: number, playedRecently?: number, requested?: number, requestedRecently?: number, favorited?: number}> = new Map();

		for (const p of played.rows) {
			statsMap.set(p.fk_kid, { played: p.played });
		}
		for (const pr of playedRecently.rows) {
			const stat = statsMap.get(pr.fk_kid);
			stat.playedRecently = pr.played_recently;
			statsMap.set(pr.fk_kid, stat);
		}
		for (const r of requested.rows) {
			const stat = statsMap.get(r.fk_kid);
			stat.requested = r.requested;
			statsMap.set(r.fk_kid, stat);
		}
		for (const rr of requestedRecently.rows) {
			const stat = statsMap.get(rr.fk_kid);
			stat.requestedRecently = rr.requested_recently;
			statsMap.set(rr.fk_kid, stat);
		}
		for (const f of favorited.rows) {
			const stat = statsMap.get(f.fk_kid);
			stat.favorited = f.favorited;
			statsMap.set(f.fk_kid, stat);
		}


		const params = [];

		for (const stat of statsMap.entries()) {
			params.push([stat[0], stat[1].played, stat[1].playedRecently, stat[1].requested, stat[1].requestedRecently, stat[1].favorited]);
		}

		// This only removes songs not present in all_karas
		await db().query(sql.deleteKaraStats);
		logger.debug('Inserting into stats DB', { service });
		// Let's go!
		await transaction({ params, sql: sql.insertKaraStats });
		logger.debug('Done refreshing stats DB', { service });
	} catch (err) {
		logger.error(`Error refreshing kara stats : ${err}`, { service, obj: err });
		throw err;
	}
}

export async function selectAllKIDs(kid?: string): Promise<string[]> {
	const res = await db().query(sql.selectAllKIDs(kid), kid ? [kid] : []);
	return res.rows.map((k: Kara) => k.kid);
}

export async function updateKaraParents(kara: Kara) {
	// First removing all parents for that (child) karaoke
	await db().query(sql.deleteChildrenKara, [kara.kid]);
	if (!kara.parents) return;
	for (const pkid of kara.parents) {
		const pkara = await selectAllKIDs(pkid);
		if (!pkara[0]) throw new Error(`Parent kara ${pkid} not in database!`);
		await db().query(
			yesql(sql.insertChildrenParentKara)({
				parent_kid: pkid,
				child_kid: kara.kid,
			})
		);
	}
}
