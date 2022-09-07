import { v4 as uuidV4 } from 'uuid';

import {insertTag, selectTags} from '../dao/tag';
import { updateTagSearchVector } from '../lib/dao/tag';
import { writeTagFile } from '../lib/dao/tagfile';
import { DBTag } from '../lib/types/database/tag';
import { Tag, TagList, TagParams } from '../lib/types/tag';
import { resolvedPathRepos } from '../lib/utils/config';
import { sanitizeFile } from '../lib/utils/files';
import logger from '../lib/utils/logger';
import sentry from '../utils/sentry';

const service = 'Tags';

export function formatTagList(tagList: DBTag[], from: number, count: number): TagList {
	return {
		infos: {
			count: +count,
			from: +from || 0,
			to: +from || 0 + tagList.length
		},
		content: tagList
	};
}

export async function getTags(params: TagParams) {
	try {
		const tags = await selectTags(params);
		return formatTagList(tags, +params.from, tags[0]?.count || 0);
	} catch (err) {
		logger.error('Unable to get tags', {service, obj: err});
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	}
}

export async function getTag(tid: string) {
	try {
		const tags = await selectTags({ tid, includeStaging: true });
		const tag = tags[0];
		if (tag) return tag;
		return null;
	} catch (err) {
		logger.error('Unable to get single tag', {service, obj: err});
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	}
}

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
		updateTagSearchVector();
		return tag;
	} catch (err) {
		logger.error('Unable to add tag', {service, obj: err});
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	}
}
