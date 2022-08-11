import {pg as yesql} from 'yesql';

import {buildClauses, buildTypeClauses, db} from '../lib/dao/database';
import { WhereClause } from '../lib/types/database';
import { DBKara, DBMedia, DBYear } from '../lib/types/database/kara';
import {KaraFileV4, KaraParams} from '../lib/types/kara';
import {getConfig} from '../lib/utils/config';
import {getTagTypeName, tagTypes} from '../lib/utils/constants';
import logger from '../lib/utils/logger';
import { DBStats } from '../types/database/kara';
import * as sql from './sqls/kara';

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
	const collectionClauses = [];
	if (!params.ignoreCollections) {
		for (const collection of (params.forceCollections || getConfig().System.DefaultCollections)) {
			if (collection) collectionClauses.push(`'${collection}~${tagTypes.collections}' = ANY(ak.tid)`);
		}
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
		includeStaging,
		collectionClauses
	);
	const res = await db().query(yesql(query)(yesqlPayload.params));
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
	logger.info('Refreshing kara stats', {service: 'DB'});
	return db().query(sql.refreshKaraStats);
}
