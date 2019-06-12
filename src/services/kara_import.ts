/**
 * .kara files generation
 */

import logger from 'winston';
import {resolve, basename} from 'path';
import {getConfig} from '../lib/utils/config';
import {sendMail} from '../utils/mailer';
import {duration} from '../lib/utils/date';
import got from 'got';
import { generateKara } from '../lib/services/kara_creation';
import { getState } from '../utils/state';
import { NewKara, Kara } from '../lib/types/kara';

export async function createKara(kara: Kara) {
	const conf = getConfig();
	const state = getState();
	let newKara: NewKara;
	try {
		newKara = await generateKara(kara, true,
			resolve(state.appPath, conf.System.Path.Inbox, 'karaokes/'),
			resolve(state.appPath, conf.System.Path.Inbox, 'medias/'),
			resolve(state.appPath, conf.System.Path.Inbox, 'lyrics/')
		);
	} catch(err) {
		logger.error(`[KaraImport] Error importing kara : ${err}. Kara Data ${JSON.stringify(kara)}`);
		throw err;
	}
	const karaName = `${newKara.data.lang[0].toUpperCase()} - ${newKara.data.series[0]} - ${newKara.data.type}${newKara.data.order || ''} - ${newKara.data.title}`;
	let title = conf.Import.Template.Title || 'New kara: $kara';
	title = title.replace('$kara', karaName);
	let desc = conf.Import.Template.Description || '';
	desc = desc.replace('$file', basename(newKara.file))
		.replace('$author', newKara.data.author.join(', '))
		.replace('$title', newKara.data.title)
		.replace('$series', newKara.data.series.join(', '))
		.replace('$type', newKara.data.type)
		.replace('$order', newKara.data.order || '')
		.replace('$lang', newKara.data.lang.join(', '))
		.replace('$year', `${newKara.data.year}`)
		.replace('$singer', newKara.data.singer.join(', '))
		.replace('$tags', newKara.data.tags.join(', '))
		.replace('$songwriter', newKara.data.songwriter.join(', '))
		.replace('$creator', newKara.data.creator.join(', '))
		.replace('$groups', newKara.data.groups.join(', '))
		.replace('$duration', duration(newKara.data.mediaduration));
	try {
		if (conf.Mail.Enabled && conf.Import.Mail.Enabled) sendMail(title, desc);
	} catch(err) {
		logger.error(`[KaraImport] Could not send mail : ${err}`);
	}
	try {
		if (conf.Import.Gitlab.Enabled) {
			const gitlab = conf.Import.Gitlab;
			const params = new URLSearchParams([
				['id', `${gitlab.ProjectID}`],
				['title', title],
				['description', desc],
				['labels', gitlab.Labels.join(',')]
			]);
			const res = await got.post(`https://${gitlab.URL}/api/v4/projects/${gitlab.ProjectID}/issues?${params.toString()}`, {
				headers: {
					'PRIVATE-TOKEN': gitlab.AccessToken
				}
			});
			return JSON.parse(res.body).web_url;
		}
	} catch(err) {
		logger.error(`[KaraImport] Call to Gitlab API failed : ${err}`);
	}
}
