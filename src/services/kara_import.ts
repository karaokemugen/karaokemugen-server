/**
 * .kara files generation
 */

import logger from 'winston';
import {resolve, basename} from 'path';
import {getConfig} from '../lib/utils/config';
import {duration} from '../lib/utils/date';
import { generateKara } from '../lib/services/kara_creation';
import { getState } from '../utils/state';
import { NewKara, Kara } from '../lib/types/kara';
import { gitlabPostNewIssue } from '../lib/services/gitlab';

export async function createKara(kara: Kara) {
	const conf = getConfig();
	const state = getState();
	let newKara: NewKara;
	try {
		newKara = await generateKara(kara, true,
			resolve(state.appPath, conf.System.Path.Import, 'karaokes/'),
			resolve(state.appPath, conf.System.Path.Import, 'medias/'),
			resolve(state.appPath, conf.System.Path.Import, 'lyrics/')
		);
	} catch(err) {
		logger.error(`[KaraImport] Error importing kara : ${err}. Kara Data ${JSON.stringify(kara)}`);
		throw err;
	}
	const karaName = `${newKara.data.lang[0].toUpperCase()} - ${newKara.data.series[0] || newKara.data.singer[0]} - ${newKara.data.type}${newKara.data.order || ''} - ${newKara.data.title}`;
	let title = conf.Gitlab.IssueTemplate.Import.Title || 'New kara: $kara';
	title = title.replace('$kara', karaName);
	let desc = conf.Gitlab.IssueTemplate.Import.Description || '';
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
		if (conf.Gitlab.Enabled) return gitlabPostNewIssue(title, desc, conf.Gitlab.IssueTemplate.Import.Labels);
	} catch(err) {
		logger.error(`[KaraImport] Call to Gitlab API failed : ${err}`);
	}
}
