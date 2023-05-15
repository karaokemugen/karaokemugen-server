import { QueryResult } from 'pg';
import {pg as yesql} from 'yesql';

import {buildClauses, buildTypeClauses, db} from '../lib/dao/database.js';
import { WhereClause } from '../lib/types/database.js';
import { DBKara, DBMedia, DBYear } from '../lib/types/database/kara.js';
import {KaraFileV4, KaraParams} from '../lib/types/kara.js';
import {getConfig} from '../lib/utils/config.js';
import {getTagTypeName, tagTypes} from '../lib/utils/constants.js';
import logger from '../lib/utils/logger.js';
import { DBStats } from '../types/database/kara.js';
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

export async function selectAllYears(collections: string[]): Promise<DBYear[]> {
	const collectionsClauses = [];
	if (collections) for (const collection of collections) {
		collectionsClauses.push(`'${collection}~${tagTypes.collections}' = ANY(ak.tid)`);
	}
	const res = await db().query(sql.getYears(collectionsClauses));
	return res.rows;
}

export async function selectAllKaras(params: KaraParams, includeStaging = false): Promise<DBKara[]> {
	const filterClauses: WhereClause = params.filter
		? buildClauses(params.filter)
		: {sql: [], params: {}, additionalFrom: []};
	const typeClauses = params.q
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
	const withCTEs = ['blank AS (SELECT true)'];
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
	if (params.userAnimeList) {
		withCTEs.push(
			'anime_list_infos AS (SELECT anime_list_ids, anime_list_to_fetch FROM users where users.pk_login = :username_anime_list)'
		);
		whereClauses += ` AND (
			(SELECT anime_list_to_fetch FROM anime_list_infos) = 'myanimelist' AND myanimelist_ids::int[] && (SELECT anime_list_ids FROM anime_list_infos)
		OR (
			SELECT anime_list_to_fetch FROM anime_list_infos) = 'anilist' AND anilist_ids::int[] && (SELECT anime_list_ids FROM anime_list_infos)
		OR (
			SELECT anime_list_to_fetch FROM anime_list_infos) = 'kitsu' AND kitsu_ids::int[] && (SELECT anime_list_ids FROM anime_list_infos)
		)`;
		yesqlPayload.params.username_anime_list = params.userAnimeList;
	}
	if (params.order === 'recent') orderClauses = 'created_at DESC, ';
	if (params.order === 'played') {
		orderClauses = 'ks.played DESC, ';
		selectClause += 'ks.played,';
		groupClause += 'ks.played, ';
		joinClause += ' LEFT OUTER JOIN kara_stats ks ON ks.fk_kid = ak.pk_kid ';
	}
	if (params.order === 'playedRecently') {
		orderClauses = 'ks.played_recently DESC, ';
		selectClause += 'ks.played_recently AS played,';
		groupClause += 'ks.played_recently, ';
		joinClause += ' LEFT OUTER JOIN kara_stats ks ON ks.fk_kid = ak.pk_kid ';
	}
	if (params.order === 'favorited') {
		orderClauses = 'ks.favorited DESC, ';
		selectClause += 'ks.favorited,';
		groupClause += 'ks.favorited, ';
		joinClause += ' LEFT OUTER JOIN kara_stats ks ON ks.fk_kid = ak.pk_kid ';
	}
	if (params.order === 'requested') {
		orderClauses = 'ks.requested DESC, ';
		selectClause += 'ks.requested,';
		groupClause += 'ks.requested, ';
		joinClause += ' LEFT OUTER JOIN kara_stats ks ON ks.fk_kid = ak.pk_kid ';
	}
	if (params.order === 'requestedRecently') {
		orderClauses = 'ks.requested_recently DESC, ';
		selectClause += 'ks.requested_recently AS requested,';
		groupClause += 'ks.requested_recently, ';
		joinClause += ' LEFT OUTER JOIN kara_stats ks ON ks.fk_kid = ak.pk_kid ';
	}
	if (params.from > 0) offsetClause = `OFFSET ${params.from} `;
	if (params.size > 0) limitClause = `LIMIT ${params.size} `;
	// If we're asking for random songs, here we modify the query to get them.
	if (params.random > 0) {
		orderClauses = `RANDOM(), ${orderClauses}`;
		limitClause = `LIMIT ${params.random}`;
	}
	const collectionClauses = [];
	if (!params.ignoreCollections) {
		for (const collection of (params.forceCollections || getConfig().System.DefaultCollections)) {
			if (collection) collectionClauses.push(`'${collection}~${tagTypes.collections}' = ANY(ak.tid)`);
		}
	}
	let res: QueryResult<any>;
	if (
		yesqlPayload.sql.length === 0 &&
		selectClause === '' &&
		joinClause === '' &&
		groupClause === '' &&
		whereClauses === '' &&
		yesqlPayload.additionalFrom.length === 0
	) {
		const query = sql.getAllKarasMicro(
			orderClauses,
			limitClause,
			offsetClause,
			includeStaging,
			collectionClauses,
			withCTEs,
			false
		);
		const queryCount = sql.getAllKarasMicro(
			orderClauses,
			limitClause,
			offsetClause,
			includeStaging,
			collectionClauses,
			withCTEs,
			true
		);
		res = await db().query(yesql(query)(yesqlPayload.params));
		const resCount = await db().query(yesql(queryCount)(yesqlPayload.params));
		if (res.rows[0] != null) {
			res.rows[0].count = resCount.rows[0].count;
		}
	} else {
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
			includeStaging,
			collectionClauses,
			withCTEs,
			false
		);
		const queryCount = sql.getAllKaras(
			yesqlPayload.sql,
			orderClauses,
			limitClause,
			offsetClause,
			selectClause,
			joinClause,
			groupClause,
			whereClauses,
			yesqlPayload.additionalFrom,
			includeStaging,
			collectionClauses,
			withCTEs,
			true
		);
		const [res2, resCount] = await Promise.all([
			db().query(yesql(query)(yesqlPayload.params)),
			db().query(yesql(queryCount)(yesqlPayload.params))
		]);
		res = res2;
		if (res.rows[0] != null) {
			res.rows[0].count = resCount.rows[0].count;
		}
	}
	return res.rows.map((row) => {
		const { tags, ...rowWithoutTags } = row;

		for (const tagType of Object.keys(tagTypes)) {
			rowWithoutTags[tagType] = [];
		}
		if (tags == null) {
			return rowWithoutTags;
		}
		for (const tag of tags) {
			if (tag?.type_in_kara == null) continue;
			const type = getTagTypeName(tag.type_in_kara);
			if (type == null) continue;
			rowWithoutTags[type].push(tag);
		}
		return rowWithoutTags;
	});
}

export async function insertKara(kara: KaraFileV4) {
	await db().query(
		yesql(sql.insertKara)({
			karafile: kara.meta.karaFile,
			mediafile: kara.medias[0].filename,
			subfile: kara.medias[0].lyrics[0]?.filename,
			titles: kara.data.titles,
			titles_aliases: JSON.stringify(kara.data.titles_aliases || []),
			titles_default_language: kara.data.titles_default_language || 'eng',
			year: kara.data.year,
			songorder: kara.data.songorder || null,
			duration: kara.medias[0].duration,
			gain: kara.medias[0].audiogain,
			loudnorm: kara.medias[0].loudnorm,
			modified_at: kara.data.modified_at,
			created_at: kara.data.created_at,
			kid: kara.data.kid,
			repository: kara.data.repository,
			mediasize: kara.medias[0].filesize,
			download_status: 'DOWNLOADED',
			comment: kara.data.comment,
			ignoreHooks: kara.data.ignoreHooks || false,
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
	logger.info('Refreshing kara stats', {service});
	await db().query(sql.deleteKaraStats);
	return db().query(sql.refreshKaraStats);
}
