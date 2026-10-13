import { databaseReady, db, newDBTask, paramWords, prepareNamedParamsQuery } from '../lib/dao/database.js';
import { refreshTags } from '../lib/dao/tag.js';
import { WhereClause } from '../lib/types/database.js';
import { DBTag } from '../lib/types/database/tag.js';
import { Tag, TagParams } from '../lib/types/tag.js';
import { tagTypes } from '../lib/utils/constants.js';
import * as sql from './sqls/tag.js';

export async function selectTags(params: TagParams): Promise<DBTag[]> {
	const filterClauses = params.filter
		? buildTagClauses(params.filter)
		: { sql: [], params: {} };

	if (!params.includeStaging) {
		filterClauses.sql.push("at.repository != 'Staging'");
	}
	if (params.type) {
		filterClauses.sql.push('at.types @> ARRAY[:type::int]');
	}
	if (params.tid) {
		filterClauses.sql.push('at.pk_tid = :tid');
	}

	const collections = params.collections ?? [];
	const withCollections = collections.length > 0;
	const singleType = !!params.type;
	const stripEmpty = !!params.stripEmpty;

	const sharedOpts = {
		filterClauses: filterClauses.sql,
		withCollections,
		singleType,
		stripEmpty,
		collectionType: tagTypes.collections,
	};

	const query = sql.selectTags({
		...sharedOpts,
		orderClause:
			singleType && params.order === 'karacount'
				? 'karacounttype DESC NULLS LAST, at.name'
				: 'at.name',
		limitClause: params.size > 0 ? 'LIMIT :size' : '',
		offsetClause: params.from > 0 ? 'OFFSET :from' : '',
	});
	const countQuery = sql.selectTagsCount(sharedOpts);

	const sharedParams = {
		...filterClauses.params, 
		tid: params.tid,
		type: singleType ? params.type : undefined,
		collections: withCollections ? collections : undefined,
	};
	const queryParams = {
		...sharedParams,
		...(params.size > 0 ? { size: params.size } : {}),
		...(params.from > 0 ? { from: params.from } : {}),
	};
	const countParams = { ...sharedParams };

	const [res, countRes] = await Promise.all([
		db().query(prepareNamedParamsQuery(query)(queryParams)),
		db().query(prepareNamedParamsQuery(countQuery)(countParams)),
	]);

	const count: number = countRes.rows[0]?.count ?? 0;

	res.rows.forEach((e: any, i: number) => {
		if (singleType) {
			res.rows[i].karacount = { [+params.type]: e.karacounttype };
			delete res.rows[i].karacounttype;
		} else {
			const karacounts = e.karacount;
			res.rows[i].karacount = {};
			karacounts?.forEach((k: any) => (res.rows[i].karacount[k.type] = k.count));
		}
		res.rows[i].count = count;
	});

	return res.rows;
}

function buildTagClauses(words: string): WhereClause {
	return {
		sql: ["at.tag_search_vector @@ to_tsquery('public.unaccent_conf', :tsquery)"],
		params: { tsquery: paramWords(words).join(' & ') },
		additionalFrom: null,
	};
}

export async function insertTag(tag: Tag) {
	await db().query(sql.insertTag, [
		tag.tid,
		tag.name,
		tag.types,
		tag.short || null,
		tag.i18n || {},
		JSON.stringify(tag.aliases || []),
		tag.tagfile,
		tag.repository,
		tag.noLiveDownload || false,
		tag.priority || 10,
		tag.karafile_tag || null,
		tag.description || {},
		tag.external_database_ids || null,
	]);
	refreshTags();
	refreshAllKaraTag();
	await databaseReady();
}

export async function refreshAllKaraTag() {
	newDBTask({ func: refreshAllKaraTagTask, name: 'refreshAllKaraTags' });
	await databaseReady();
}

async function refreshAllKaraTagTask() {
	await db().query(sql.refreshAllKaraTag);
}
