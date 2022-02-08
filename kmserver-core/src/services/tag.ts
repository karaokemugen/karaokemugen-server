import {selectTags, selectTag, insertTag} from '../dao/tag';
import { TagParams, TagList, Tag } from '../lib/types/tag';
import { writeTagFile } from '../lib/dao/tagfile';
import { resolvedPathRepos } from '../lib/utils/config';
import { v4 as uuidV4 } from 'uuid';
import { DBTag } from '../lib/types/database/tag';
import sentry from '../utils/sentry';
import { refreshTags, updateTagSearchVector } from '../lib/dao/tag';
import { sanitizeFile } from '../lib/utils/files';

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

export async function getTag(tid: string) {
	try {
		let tag = await selectTag(tid);
		if (tag) return tag;
		return null;
	} catch(err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	}
}

/* "Edit" a tag. Save its new version */
// Unused? TODO: consider its removal
/*export async function editTag(_tid: string, tag: Tag, _opts: any) {
	try {
		await addTag(tag, null);
		return tag;
	} catch(err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	}
}*/

export async function addTag(tag: Tag, opts = {forceRepo: ''}) {
	try {
		tag.tid = uuidV4();
		tag.tagfile = `${sanitizeFile(tag.name)}.${tag.tid.substring(0, 8)}.tag.json`;
		if (opts.forceRepo) {
			tag.repository = opts.forceRepo;
		}
		await Promise.all([
			insertTag(tag),
			writeTagFile(tag, resolvedPathRepos('Tags', 'Staging')[0])
		]);
		await updateTagSearchVector();
		refreshTags();
		return tag;
	} catch(err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	}
}
