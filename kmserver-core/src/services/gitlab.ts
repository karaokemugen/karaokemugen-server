import {findUserByName} from './user';
import sentry from '../utils/sentry';
import { getConfig } from '../lib/utils/config';
import HTTP from '../lib/utils/http';
import logger from '../lib/utils/logger';

/** Posts a new issue to gitlab and return its URL */
export async function gitlabPostNewIssue(title: string, desc: string, labels: string[]): Promise<string> {
	const conf = getConfig();
	if (!labels) labels = [];
	const params = new URLSearchParams([
		['id', `${conf.Gitlab.ProjectID}`],
		['title', title],
		['description', desc],
		['labels', labels.join(',')]
	]);
	const res = await HTTP.post(`${conf.Gitlab.Host}/api/v4/projects/${conf.Gitlab.ProjectID}/issues?${params.toString()}`, {
		headers: {
			'PRIVATE-TOKEN': conf.Gitlab.Token
		},
		timeout: 25000
	});
	return JSON.parse(res.body).web_url;
}

/** Close an issue */
export async function closeIssue(issue: number) {
	const conf = getConfig();
	const params = new URLSearchParams([
		['state_event', 'close']
	]);
	await HTTP.put(`${conf.Gitlab.Host}/api/v4/projects/${conf.Gitlab.ProjectID}/issues/${issue}?${params.toString()}`, {
		headers: {
			'PRIVATE-TOKEN': conf.Gitlab.Token
		},
		timeout: 25000
	});
}

export async function postSuggestionToKaraBase(title: string, serie:string, type:string, link:string, username: string): Promise<string> {
	const conf = getConfig().Gitlab.IssueTemplate;
	let titleIssue = conf?.Suggestion?.Title
		? conf.Suggestion.Title
		: '[suggestion] $serie - $title';
	titleIssue = titleIssue.replace('$title', title);
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
}
