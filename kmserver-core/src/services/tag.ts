import { v4 as uuidV4 } from 'uuid';

import {insertTag, selectTags} from '../dao/tag.js';
import { refreshTags, updateTagSearchVector } from '../lib/dao/tag.js';
import { writeTagFile } from '../lib/dao/tagfile.js';
import { DBTag } from '../lib/types/database/tag.js';
import { Tag, TagList, TagParams } from '../lib/types/tag.js';
import { getConfig, resolvedPathRepos } from '../lib/utils/config.js';
import { tagTypes } from '../lib/utils/constants.js';
import { ErrorKM } from '../lib/utils/error.js';
import { sanitizeFile } from '../lib/utils/files.js';
import logger from '../lib/utils/logger.js';
import { isNumber, isUUID } from '../lib/utils/validators.js';
import sentry from '../utils/sentry.js';
import { setState } from '../utils/state.js';

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
		throw new ErrorKM('GET_TAGS_ERROR');
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
		throw new ErrorKM('GET_TAG_ERROR');
	}
}

export async function addTag(tag: Tag, opts = {forceRepo: ''}) {
	try {
		// Check if tag is forbidden
		const conf = getConfig();
		if (conf.Frontend?.Import?.LimitedTagTypes && tag.types.some(t => conf.Frontend.Import.LimitedTagTypes.includes(t))) {
			throw new ErrorKM('FORBIDDEN_TAG_TYPE', 403, false);
		}

		tag.tid = tag.tid || uuidV4();
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
	} catch (err) {
		logger.error('Unable to add tag', {service, obj: err});
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err instanceof ErrorKM ? err : new ErrorKM('ADD_TAG_ERROR');
	}
}

export async function setSensitiveTags() {
	const sensitiveTags = [];
	try {
		const configSensitiveTags = getConfig().Frontend.SensitiveTags;
		if (configSensitiveTags && Array.isArray(configSensitiveTags)) {
			for (const tag of configSensitiveTags) {
				const [tid, type] = tag.split('~');
				if (!isUUID(tid)) throw `${tid} is not a UUID`;
				if (!isNumber(type)) throw `${type} is not tag type number`;
				sensitiveTags.push(tag);
			}
		}
	} catch(err) {
		logger.warn(`Getting sensitive tags from config failed : ${err}`, { service, obj: err });
		const tags = await getTags({type: [tagTypes.warnings]});
		for (const tag of tags.content) {
			sensitiveTags.push(`${tag.tid}~${tagTypes.warnings}`);
		}
	} finally {
		logger.info(`Setting tags as sensitive : ${sensitiveTags.join(',')}`, { service });
		setState({ sensitiveTags });
	}

}