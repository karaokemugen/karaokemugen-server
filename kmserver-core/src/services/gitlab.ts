import { cloneDeep, isEqual } from 'lodash';

import { selectAllKaras } from '../dao/kara.js';
import { getSongSeriesSingers } from '../lib/services/kara.js';
import { getConfig } from '../lib/utils/config.js';
import { tagTypes } from '../lib/utils/constants.js';
import { duration } from '../lib/utils/date.js';
import { ErrorKM } from '../lib/utils/error.js';
import HTTP from '../lib/utils/http.js';
import logger from '../lib/utils/logger.js';
import { EditElement } from '../types/karaImport.js';
import { SuggestionIssue } from '../types/suggestions.js';
import sentry from '../utils/sentry.js';
import { getAllKaras, getKara } from './kara.js';
import { findUserByName } from './user.js';

const service = 'Gitlab';

export async function buildIssue(kid: string, edit?: EditElement) {
	const conf = getConfig();
	let kara = await getKara({
		q: `k:${kid}`
	});
	let newParents = [];
	if (kara.parents.length > 0) {
		const parents = await getAllKaras({
			q: `k:${kara.parents.join(',')}`
		});
		newParents = parents.content.map(k => k.songname);
	}
	const issueTemplate = edit ? conf.Gitlab.IssueTemplate.Edit : conf.Gitlab.IssueTemplate.Import;
	// Trim tags if there's more than 5 elements.
	// Save original array somewhere
	const fullKara = cloneDeep(kara);
	for (const tagType of Object.keys(tagTypes)) {
		if (kara[tagType] && kara[tagType].length > 5) {
			kara[tagType] = kara[tagType].slice(0, 5);
			kara[tagType].push('(and more...)');
		}
	}
	const title = (issueTemplate.Title || `Inbox ${edit ? 'edit' : 'creation'}: $kara`)
		.replace('$kara', kara.songname);
	let desc = (issueTemplate.Description || '')
		.replace('$instance', conf.Frontend.Host)
		.replace('$songname', kara.songname)
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
		.replace('$duration', duration(kara.duration))
		.replace('$fromDisplayType', kara.from_display_type || '');
		if (edit?.oldKara) {
			const changes = [];
			desc += `

# Modifications

`;
			if (edit.modifiedLyrics) changes.push('LYRICS updated');
			if (edit.modifiedMedia) changes.push('MEDIA updated');
			if (edit.oldKara.from_display_type !== kara.from_display_type) changes.push(`FROM DISPLAY TYPE updated : ${edit.oldKara.from_display_type} => ${kara.from_display_type}`);
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
					oldParents = karas.content.map(k => k.songname);
				}

				changes.push(`PARENTS updated : ${oldParents} => ${newParents}`);
			}
			// We need to restore kara from fullKara since we may have removed some tags when displaying earlier
			kara = cloneDeep(fullKara);
			// I know this is unreadable but take some ibuprofen and it'll be fine.
			for (const tagType of Object.keys(tagTypes)) {
				if (!isEqual(edit.oldKara[tagType], kara[tagType])) changes.push(`${tagType.toUpperCase()} updated : (${edit.oldKara[tagType]?.map((t: any) => t.name).join(', ')}) => (${kara[tagType]?.map((t: any) => t.name).join(', ')})`);
			}
			desc += changes.map(c => `- ${c}`).join('\n');
		}
	return {
		title,
		description: desc
	}
}

/** Use the appropriate template and post an inbox element to GitLab * */
export async function createInboxIssue(kid: string, edit?: EditElement) {
	const conf = getConfig();
	const issueTemplate = edit ? conf.Gitlab.IssueTemplate.Edit : conf.Gitlab.IssueTemplate.Import;
	const issue = await buildIssue(kid, edit);
	return gitlabCreateIssue(issue.title, issue.description, issueTemplate.Labels);
}

/** Edit issue and rebuild description and title if needed */
export async function editInboxIssue(kid: string, issueID: number, edit?: EditElement) {
	const issue = await buildIssue(kid, edit);
	return gitlabEditIssue(issueID, issue);
}

export async function gitlabEditIssue(issueID: number, changes: {
	title?: string,
	desc?: string,
	add_labels?: string,
	due_date?: string,
	remove_labels?: string,
}) {
	const conf = getConfig();
	if (!conf.System.Repositories[0].Git?.ProjectID) return;
	const params = {
		title: changes.title,
		// Tildes are often found in japanese names and can cause strikeout text in markdown once rendered.
		description: changes.desc?.replaceAll('~', '\\~'),
		add_labels: changes.add_labels,
		due_date: changes.due_date
	};
	const url = new URL(conf.System.Repositories[0].Git.URL);
	try {
		await HTTP.put(`${url.protocol}//${url.hostname}/api/v4/projects/${conf.System.Repositories[0].Git.ProjectID}/issues/${issueID}`, params, {
			headers: {
				'PRIVATE-TOKEN': conf.System.Repositories[0].Git.Password,
				'Content-Type': 'application/json'
			},
			timeout: 25000
		});
	} catch(err) {
		logger.error(`Unable to update issue ${issueID}`, {service, obj: err?.response?.data?.message?.error || err});
		sentry.addErrorInfo('Issue changes', JSON.stringify(changes, null, 2));
		sentry.error(err);
		throw err;
	}

}

/** Posts a new issue to gitlab and return its URL */
async function gitlabCreateIssue(title: string, desc: string, labels: string[]): Promise<string> {
	try {
		const conf = getConfig();
		if (!conf.System.Repositories[0].Git?.ProjectID) return;
		if (!labels) labels = [];
		const params = {
			id: `${conf.System.Repositories[0].Git.ProjectID}`,
			title,
			// Tildes are often found in japanese names and can cause strikeout text in markdown once rendered.
			description: desc.replaceAll('~', '\\~'),
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
		logger.error('Unable to post new issue', {service, obj: err?.response?.data?.message?.error || err});
		sentry.addErrorInfo('Issue title', title);
		sentry.addErrorInfo('Issue body', desc);
		sentry.addErrorInfo('Issue labels', labels.join(', '));
		sentry.error(err);
		throw err;
	}
}

export async function createSuggestionIssue(suggestion: SuggestionIssue): Promise<string> {
	try {
		const conf = getConfig().Gitlab.IssueTemplate;
		let titleIssue = conf?.Suggestion?.Title
			? conf.Suggestion.Title
			: '[suggestion] $displaytype - $title $version';
		titleIssue = titleIssue.replace('$title', suggestion.title);
		titleIssue = titleIssue.replace('$version', suggestion.version ? `~ ${suggestion.version} Vers.` : '');
		const displaytype =
			suggestion.singer && suggestion.serie
				? `${suggestion.serie} / ${suggestion.singer}`
				: `${suggestion.serie || ''}${suggestion.singer}`;
		titleIssue = titleIssue.replace('$displaytype', displaytype);
		let desc = conf?.Suggestion?.Description
			? conf.Suggestion.Description
			: 'From $username : it would be nice if someone could time this!';
		const user = await findUserByName(suggestion.username);
		desc = desc.replace('$username', user ? user.nickname : suggestion.username);
		desc = desc.replace('$title', suggestion.title);
		desc = desc.replace('$series', suggestion.serie || '');
		desc = desc.replace('$singer', suggestion.singer);
		desc = desc.replace('$version', suggestion.version);
		desc = desc.replace('$link', suggestion.link);
		desc = desc.replace('$lyricsLink', suggestion.lyricsLink);
		desc = desc.replace('$comment', suggestion.comment);
		return await gitlabCreateIssue(titleIssue, desc, conf.Suggestion.Labels);
	} catch (err) {
		logger.error('Unable to post new suggestion to gitlab', { service, obj: err });
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw new ErrorKM('POST_SUGGESTION_ERROR');
	}
}

export async function createKaraIssue(kid: string, type: 'Media' | 'Metadata' | 'Lyrics', comment: string, username: string) {
	try {
		const karas = await selectAllKaras({
			q: `k:${kid}`,
			ignoreCollections: true
		}, true);
		const kara = karas[0];
		if (!kara) throw new ErrorKM('KARA_UNKNOWN', 404, false);
		logger.debug('Kara:', {service: 'GitLab', obj: kara});
		const serieOrSingergroupOrSinger = getSongSeriesSingers(kara);
		const langs = (kara.langs.length > 0 && kara.langs[0].name.toUpperCase()) || '';
		const versions = (kara.versions.length > 0 &&  ` ~ ${kara.versions.map(v => v.name).join(' ')} Vers.`) || '';
		const songtype = (kara.songtypes.length > 0 && kara.songtypes[0].name) || '';
		const karaName = `${langs} - ${serieOrSingergroupOrSinger} - ${songtype}${kara.songorder || ''} - ${kara.titles[kara.titles_default_language]}${versions}`;
		const conf = getConfig();
		const issueTemplate = conf.Gitlab.IssueTemplate.KaraProblem[type];
		let title = issueTemplate.Title || '$kara';
		title = title.replace('$kara', karaName);
		let desc = issueTemplate.Description || '';
		desc = desc.replace('$username', username)
			.replace('$comment', comment)
			.replace('$url', `https://${getConfig().Frontend.Host}/kara/xxx/${kid}`);
		if (conf.Gitlab.Enabled) return await gitlabCreateIssue(title, desc, issueTemplate.Labels);
	} catch (err) {
		logger.error(`Unable to create issue for song ${kid}`, {service, obj: err});
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err, 'warning');
		throw err instanceof ErrorKM ? err : new ErrorKM('NEW_KARA_ISSUE_ERROR');
	}
}
