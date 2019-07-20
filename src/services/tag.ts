import {selectTags, selectTagByNameAndType} from '../dao/tag';
import { TagParams, TagList, Tag } from '../lib/types/tag';
import { DBTag } from '../lib/types/database/tag';
import { writeTagFile } from '../lib/dao/tagfile';
import { resolvedPathImport } from '../lib/utils/config';

export function formatTagList(tagList: DBTag[], from: number, count: number): TagList {
	return {
		infos: {
			count: count,
			from: from,
			to: from + tagList.length
		},
		content: tagList
	};
}

export async function getTags(params: TagParams) {
	const tags = await selectTags(params);
	return formatTagList(tags.slice(params.from || 0,
		(params.from || 0) + params.size || 999999999), params.from || 0, tags.length);
}

export async function getOrAddTagID(tagObj: Tag) {
	const tag = await selectTagByNameAndType(tagObj.name, tagObj.types);
	await writeTagFile(tagObj, resolvedPathImport());
	return tag;
}