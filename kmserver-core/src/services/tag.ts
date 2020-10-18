import {selectTags, selectTagByNameAndType, selectTag} from '../dao/tag';
import { TagParams, TagList, Tag } from '../lib/types/tag';
import { writeTagFile } from '../lib/dao/tagfile';
import { resolvedPathImport } from '../lib/utils/config';
import { findTagInImportedFiles } from '../dao/tagfile';
import { IDQueryResult } from '../lib/types/kara';
import { v4 as uuidV4 } from 'uuid';
import { DBTag } from '../lib/types/database/tag';
import sentry from '../utils/sentry';

export function formatTagList(tagList: DBTag[], from: number, count: number): TagList {
	return {
		infos: {
			count: +count,
			from: +from,
			to: +from + +count
		},
		content: tagList
	};
}

export async function getTags(params: TagParams) {
	try {
		const tags = await selectTags(params);
		return formatTagList(tags, +params.from, tags[0]?.count || 0);
	} catch(err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	}
}

export async function getTag(tid: string, findInImportedFiles: boolean = true) {
	try {
		let tag = await selectTag(tid);
		if (tag) return tag;
		if (findInImportedFiles) {
			// If no tag is found, check in import folder if we have a tag by the same name and type
			tag = await findTagInImportedFiles(tag.name, tag.types);
			if (tag) return tag;
		}
		return null;
	} catch(err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	}
}

/* "Edit" a tag. Save its new version */
export async function editTag(_tid: string, tag: Tag, _opts: any) {
	try {
		await addTag(tag, null);
		return tag;
	} catch(err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	}
}

export async function addTag(tag: Tag, _opts: any) {
	try {
		tag.tid = uuidV4();
		await writeTagFile(tag, resolvedPathImport());
		return tag;
	} catch(err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	}
}

export async function getOrAddTagID(tagObj: Tag): Promise<IDQueryResult> {
	try {
		let tag = await selectTagByNameAndType(tagObj.name, tagObj.types);
		if (tag) return {id: tag.tid, new: false};
		// If no tag is found, check in import folder if we have a tag by the same name and type
		tag = await findTagInImportedFiles(tagObj.name, tagObj.types);
		if (tag) return {id: tag.tid, new: false};
		tagObj.tid = uuidV4();
		await writeTagFile(tagObj, resolvedPathImport());
		return {id: tagObj.tid, new: true};
	} catch(err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	}
}
