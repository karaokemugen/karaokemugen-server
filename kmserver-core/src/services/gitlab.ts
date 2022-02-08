import {basename} from 'path';

import { duration } from '../lib/utils/date';
import { getConfig } from '../lib/utils/config';
import HTTP from '../lib/utils/http';
import logger from '../lib/utils/logger';
import sentry from '../utils/sentry';
import { findUserByName } from './user';
import { getKara } from './kara';

/** Use the appropriate template and post an inbox element to GitLab **/
export async function gitlabPostNewSuggestion(kid: string, edited_kid?: string) {
	const conf = getConfig();
	const kara = await getKara({
		q: `k:${kid}`
	});
	const issueTemplate = edited_kid ? conf.Gitlab.IssueTemplate.Edit:conf.Gitlab.IssueTemplate.Import;
	const title = (issueTemplate.Title || `Inbox ${edited_kid ? 'edit':'creation'}: $kara`)
		.replace('$kara', basename(kara.karafile, '.kara.json'));
	const desc = (issueTemplate.Description || '')
		.replace('$file', kara.karafile)
		.replace('$comment', kara.comment || '')
		.replace('$author', kara.authors.map(t => t.name).join(', '))
		.replace('$title', JSON.stringify(kara.titles))
		.replace('$series', kara.series.map(t => t.name).join(', '))
		.replace('$type', kara.songtypes.map(t => t.name).join(', '))
		.replace('$order', (kara.songorder && kara.songorder.toString()) || '')
		.replace('$lang', kara.langs.map(t => t.name).join(', '))
		.replace('$year', kara.year.toString())
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
		.replace('$duration', duration(kara.duration));
	return gitlabPostNewIssue(title, desc, issueTemplate.Labels);
}

/** Posts a new issue to gitlab and return its URL */
export async function gitlabPostNewIssue(title: string, desc: string, labels: string[]): Promise<string> {
	try {
		const conf = getConfig();
		if (!labels) labels = [];
		const params = {
			id: `${conf.Gitlab.ProjectID}`,
			title,
			description: desc,
			labels: labels.join(',')
		};
		const res = await HTTP.post(`${conf.Gitlab.Host}/api/v4/projects/${conf.Gitlab.ProjectID}/issues`, params, {
			headers: {
				'PRIVATE-TOKEN': conf.Gitlab.Token,
				'Content-Type': 'application/json'
			},
			timeout: 25000
		});
		return res.data.web_url;
	} catch(err) {
		logger.error('Unable to post new issue', {service: 'Gitlab', obj: err});
		throw err;
	}
}

/** Close an issue */
export async function closeIssue(issue: number) {
	try {
		const conf = getConfig();
		const params = {
			state_event: 'close'
		};
		await HTTP.put(`${conf.Gitlab.Host}/api/v4/projects/${conf.Gitlab.ProjectID}/issues/${issue}`, params, {
			headers: {
				'PRIVATE-TOKEN': conf.Gitlab.Token,
				'Content-Type': 'application/json'
			},
			timeout: 25000
		});
	} catch(err) {
		logger.error('Unable to close issue', {service: 'Gitlab', obj: err});
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
		} catch(err) {
			sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
			sentry.error(err);
			logger.error('Call to Gitlab API failed', {service: 'KaraSuggestion', obj: err});
		}
	} catch(err) {
		logger.error('Unable to post new suggestion to gitlab', {service: 'Gitlab', obj: err});
		throw err;
	}
}
