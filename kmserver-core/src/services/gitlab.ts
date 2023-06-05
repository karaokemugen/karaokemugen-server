import { isEqual } from 'lodash';
import {basename} from 'path';

import { getConfig } from '../lib/utils/config.js';
import { tagTypes } from '../lib/utils/constants.js';
import { duration } from '../lib/utils/date.js';
import HTTP from '../lib/utils/http.js';
import logger from '../lib/utils/logger.js';
import { EditElement } from '../types/karaImport.js';
import sentry from '../utils/sentry.js';
import { getAllKaras, getKara } from './kara.js';
import { findUserByName } from './user.js';

const service = 'Gitlab';

/** Use the appropriate template and post an inbox element to GitLab * */
export async function gitlabPostNewKara(kid: string, edit?: EditElement) {
	const conf = getConfig();
	const kara = await getKara({
		q: `k:${kid}`
	});
	let newParents = [];
	if (kara.parents.length > 0) {
		const parents = await getAllKaras({
			q: `k:${kara.parents.join(',')}`
		});
		newParents = parents.content.map(k => k.karafile);
	}
	const issueTemplate = edit ? conf.Gitlab.IssueTemplate.Edit : conf.Gitlab.IssueTemplate.Import;
	const title = (issueTemplate.Title || `Inbox ${edit ? 'edit' : 'creation'}: $kara`)
		.replace('$kara', basename(kara.karafile, '.kara.json'));
	let desc = (issueTemplate.Description || '')
		.replace('$file', kara.karafile)
		.replace('$newSub', edit ? edit.modifiedLyrics.toString() : 'N/A')
		.replace('$newVideo', edit ? edit.modifiedMedia.toString() : 'N/A')
		.replace('$comment', kara.comment || '')
		.replace('$author', kara.authors.map(t => t.name).join(', '))
		.replace('$title', JSON.stringify(kara.titles))
		.replace('$series', kara.series.map(t => t.name).join(', '))
		.replace('$franchises', kara.franchises.map(t => t.name).join(', '))
		.replace('$type', kara.songtypes.map(t => t.name).join(', '))
		.replace('$order', (kara.songorder && kara.songorder.toString()) || '')
		.replace('$lang', kara.langs.map(t => t.name).join(', '))
		.replace('$year', kara.year.toString())
		.replace('$singergroup', kara.singergroups.map(t => t.name).join(', '))
		.replace('$singer', kara.singers.map(t => t.name).join(', '))
		.replace('$tags', kara.misc.map(t => t.name).join(', '))
		.replace('$songwriter', kara.songwriters.map(t => t.name).join(', '))
		.replace('$creator', kara.creators.map(t => t.name).join(', '))
		.replace('$groups', kara.groups.map(t => t.name).join(', '))
		.replace('$families', kara.families.map(t => t.name).join(', '))
		.replace('$genres', kara.genres.map(t => t.name).join(', '))
		.replace('$platforms', kara.platforms.map(t => t.name).join(', '))
		.replace('$origins', kara.origins.map(t => t.name).join(', '))
		.replace('$versions', kara.versions.map(t => t.name).join(', '))
		.replace('$warnings', kara.warnings.map(t => t.name).join(', '))
		.replace('$collections', kara.collections.map(t => t.name).join(', '))
		.replace('$parents', newParents.join(', '))
		.replace('$duration', duration(kara.duration));
		if (edit) {
			const changes = [];
			desc += `

# Modifications

`;
			if (edit.modifiedLyrics) changes.push('LYRICS updated');
			if (edit.modifiedMedia) changes.push('MEDIA updated');
			if (!isEqual(edit.oldKara.year, kara.year)) changes.push(`YEAR updated : ${edit.oldKara.year} => ${kara.year}`);
			if (!isEqual(edit.oldKara.songorder, kara.songorder)) changes.push(`SONGORDER updated : ${edit.oldKara.songorder} => ${kara.songorder}`);
			if (!isEqual(edit.oldKara.titles, kara.titles)) changes.push(`TITLES updated : ${JSON.stringify(edit.oldKara.titles, null, 2)} => ${JSON.stringify(kara.titles, null, 2)}`);
			if (!isEqual(edit.oldKara.titles_aliases, kara.titles_aliases)) changes.push(`TITLES ALIASES updated : ${JSON.stringify(edit.oldKara.titles_aliases, null, 2)} => ${JSON.stringify(kara.titles_aliases, null, 2)}`);
			if (!isEqual(edit.oldKara.titles_default_language, kara.titles_default_language)) changes.push(`TITLES DEFAULT LANGUAGE updated : ${edit.oldKara.titles_default_language} => ${kara.titles_default_language}`);
			if (!isEqual(edit.oldKara.parents, kara.parents)) {
				// Fetch parents
				let oldParents = [];
				if (edit.oldKara.parents.length > 0) {
					const karas = await getAllKaras({
						q: `k:${edit.oldKara.parents.join(',')}`
					});
					oldParents = karas.content.map(k => k.karafile);
				} 
				
				changes.push(`PARENTS updated : ${oldParents} => ${newParents}`);
			}
			// I know this is unreadable but take some ibuprofen and it'll be fine.
			for (const tagType of Object.keys(tagTypes)) {
				if (!isEqual(edit.oldKara[tagType], kara[tagType])) changes.push(`${tagType.toUpperCase()} updated : (${edit.oldKara[tagType]?.map((t: any) => t.name).join(', ')}) => (${kara[tagType]?.map((t: any) => t.name).join(', ')})`);
			}
			desc += changes.map(c => `- ${c}`).join('\n');
		}
	return gitlabPostNewIssue(title, desc, issueTemplate.Labels);
}

/** Posts a new issue to gitlab and return its URL */
export async function gitlabPostNewIssue(title: string, desc: string, labels: string[]): Promise<string> {
	try {
		const conf = getConfig();
		if (!labels) labels = [];
		const params = {
			id: `${conf.System.Repositories[0].Git.ProjectID}`,
			title,
			description: desc,
			labels: labels.join(',')
		};
		const url = new URL(conf.System.Repositories[0].Git.URL);
		const res = await HTTP.post(`${url.protocol}//${url.hostname}/api/v4/projects/${conf.System.Repositories[0].Git.ProjectID}/issues`, params, {
			headers: {
				'PRIVATE-TOKEN': conf.System.Repositories[0].Git.Password,
				'Content-Type': 'application/json'
			},
			timeout: 25000
		});
		return res.data.web_url;
	} catch (err) {
		logger.error('Unable to post new issue', {obj: err});
		sentry.addErrorInfo('Issue title', title);
		sentry.addErrorInfo('Issue body', desc);
		sentry.addErrorInfo('Issue labels', labels.join(', '));
		sentry.error(err);
		throw err;
	}
}

export async function postSuggestionToKaraBase(title: string, serie:string, type:string, link:string, username: string): Promise<string> {
	try {
		const conf = getConfig().Gitlab.IssueTemplate;
		let titleIssue = conf?.Suggestion?.Title
			? conf.Suggestion.Title
			: '[suggestion] $serie - $type - $title';
		titleIssue = titleIssue.replace('$title', title);
		titleIssue = titleIssue.replace('$type', type);
		titleIssue = titleIssue.replace('$serie', serie);
		let desc = conf?.Suggestion?.Description
			? conf.Suggestion.Description
			: 'From $username : it would be nice if someone could time this!';
		const user = await findUserByName(username);
		desc = desc.replace('$username', user ? user.nickname : username);
		desc = desc.replace('$title', title);
		desc = desc.replace('$serie', serie);
		desc = desc.replace('$type', type);
		desc = desc.replace('$link', link);
		try {
			return await gitlabPostNewIssue(titleIssue, desc, conf.Suggestion.Labels);
		} catch (err) {
			sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
			sentry.error(err);
			logger.error('Call to Gitlab API failed', {service, obj: err});
		}
	} catch (err) {
		logger.error('Unable to post new suggestion to gitlab', {service, obj: err});
		throw err;
	}
}
