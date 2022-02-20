import {pg as yesql} from 'yesql';

import { db, paramWords } from '../lib/dao/database';
import { WhereClause } from '../lib/types/database';
import { DBTag } from '../lib/types/database/tag';
import { Tag, TagParams } from '../lib/types/tag';
import sql = require('./sqls/tag');
import {refreshTags} from '../lib/dao/tag';

export async function selectTag(tid: string): Promise<Tag> {
	const res = await db().query(sql.selectTag, [tid]);
	if (!res.rows[0]) return null;
	const karacounts = res.rows[0].karacount;
	res.rows[0].karacount = {};
	karacounts && karacounts.forEach((k: any) => res.rows[0].karacount[k.type] = k.count);
	return res.rows[0];
}

export async function selectTags(params: TagParams): Promise<DBTag[]> {
	const filterClauses = params.filter
		? buildTagClauses(params.filter)
		: {sql: [], params: {}, additionalFrom: []};
	const typeClauses = params.type > 0 ? ` AND t.types @> ARRAY[${params.type}]` : '';
	let stripClause = '';
	let limitClause = '';
	let offsetClause = '';
	let joinClauses = '';
	let orderClause = 'name';
	if (params.type > 0) {
		joinClauses = `LEFT   JOIN LATERAL (
	   	SELECT elem->>'count' AS karacounttype
	   	FROM   jsonb_array_elements(at.karacount::jsonb) a(elem)
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
	if (params.from > 0) offsetClause = `OFFSET ${params.from} `;
	if (params.size > 0) limitClause = `LIMIT ${params.size} `;
	if (!params.includeStaging) {
		filterClauses.sql.push('t.repository != \'Staging\'');
	}
	const query = sql.getAllTags(
filterClauses.sql,
typeClauses,
limitClause,
offsetClause,
joinClauses,
orderClause,
stripClause,
filterClauses.additionalFrom
);
	const res = await db().query(yesql(query)(filterClauses.params));
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
	]);
}

export async function clearStagingTags(): Promise<string[]> {
	const res = await db().query(sql.clearStagingTags);
	await refreshTags();
	return res.rows.map(t => t.tagfile);
}
