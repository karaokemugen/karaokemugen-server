import { pg as yesql } from 'yesql';

import { db, paramWords } from '../lib/dao/database.js';
import { refreshTags } from '../lib/dao/tag.js';
import { WhereClause } from '../lib/types/database.js';
import { DBTag } from '../lib/types/database/tag.js';
import { Tag, TagParams } from '../lib/types/tag.js';
import { uuidRegexp } from '../lib/utils/constants.js';
import * as sql from './sqls/tag.js';

export async function selectTags(params: TagParams): Promise<DBTag[]> {
	const filterClauses = params.filter
		? buildTagClauses(params.filter)
		: {sql: [], params: {}, additionalFrom: []};
	const typeClauses = params.type > 0 ? ` AND t.types @> ARRAY[${params.type}]` : '';
	let stripClause = '';
	const limitClause = '';
	let offsetClause = '';
	let joinClauses = '';
	let orderClause = 'name';
	let whereClause = '';
	if (params.type > 0) {
		joinClauses = `LEFT   JOIN LATERAL (
	   	SELECT elem->>'count' AS karacounttype
	   	FROM   jsonb_array_elements(t_count.count_per_type::jsonb) a(elem)
	   	WHERE  elem->>'type' = '${params.type}'
	   	) a ON true
		`;
		if (params.order === 'karacount') {
			orderClause = 'karacounttype::int2 DESC NULLS LAST, name';
		}
		if (params.stripEmpty) {
			stripClause = 'AND karacounttype::int2 > 0';
		}
	}
	if (params.tid) {
		if (!params.tid.match(uuidRegexp)) throw 'Invalid TID';
		whereClause = `AND t.pk_tid = '${params.tid}'`;
	}
	if (params.from > 0) offsetClause = `OFFSET ${params.from} `;
	if (params.size > 0) {
		// Commenting this since on Erin, postgres' query planner seems to fuck up and not use LIMIT correctly.
		// limitClause = `LIMIT ${params.size} `;
	}
	if (!params.includeStaging) {
		filterClauses.sql.push('t.repository != \'Staging\'');
	}
	const collectionClauses = params.forceCollections?.map(c => `kt.fk_tid = '${c}'`) || ['TRUE'];
	const query = sql.selectTags(
filterClauses.sql,
typeClauses,
limitClause,
offsetClause,
joinClauses,
orderClause,
stripClause,
filterClauses.additionalFrom,
collectionClauses,
whereClause
);
	const res = await db().query(yesql(query)(filterClauses.params));
	// FIXME : This should not happen, we should use LIMIT instead, but Erin's query planner isn't cooperative
	// See https://gitlab.com/karaokemugen/code/karaokemugen-server/-/issues/265
	if (params.size > 0) { 
		res.rows = res.rows.slice(0, params.size);
	}
	res.rows.forEach((e: any, i: number) => {
		const karacounts = e.karacount;
		res.rows[i].karacount = {};
		karacounts && karacounts.forEach((k: any) => res.rows[i].karacount[k.type] = k.count);
	});
	return res.rows;
}

function buildTagClauses(words: string): WhereClause {
	const q = ['t.tag_search_vector @@ query'];
	return {
		sql: q,
		params: {tsquery: paramWords(words).join(' & ')},
		additionalFrom: [', to_tsquery(\'public.unaccent_conf\', :tsquery) as query, ts_rank_cd(t.tag_search_vector, query) as relevance']
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
}

export async function clearStagingTags(): Promise<string[]> {
	const res = await db().query(sql.clearStagingTags);
	await refreshTags();
	return res.rows.map(t => t.tagfile);
}
