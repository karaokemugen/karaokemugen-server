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
		newKara = await generateKara(kara,
			resolve(state.appPath, conf.System.Path.Import),
			resolve(state.appPath, conf.System.Path.Import),
			resolve(state.appPath, conf.System.Path.Import)
		);
	} catch(err) {
		logger.error(`[KaraImport] Error importing kara : ${err}. Kara Data ${JSON.stringify(kara)}`);
		throw err;
	}
	const karaName = `${newKara.data.langs[0].name.toUpperCase()} - ${newKara.data.series[0] || newKara.data.singers[0]} - ${newKara.data.songtypes[0]}${newKara.data.order || ''} - ${newKara.data.title}`;
	let title = conf.Gitlab.IssueTemplate.Import.Title || 'New kara: $kara';
	title = title.replace('$kara', karaName);
	let desc = conf.Gitlab.IssueTemplate.Import.Description || '';
	desc = desc.replace('$file', basename(newKara.file))
		.replace('$author', newKara.data.authors.map(t => t.name).join(', '))
		.replace('$title', newKara.data.title)
		.replace('$series', newKara.data.series.join(', '))
		.replace('$type', newKara.data.songtypes.map(t => t.name).join(', '))
		.replace('$order', newKara.data.order || '')
		.replace('$lang', newKara.data.langs.map(t => t.name).join(', '))
		.replace('$year', `${newKara.data.year}`)
		.replace('$singer', newKara.data.singers.map(t => t.name).join(', '))
		.replace('$tags', newKara.data.misc.map(t => t.name).join(', '))
		.replace('$songwriter', newKara.data.songwriters.map(t => t.name).join(', '))
		.replace('$creator', newKara.data.creators.map(t => t.name).join(', '))
		.replace('$groups', newKara.data.groups.map(t => t.name).join(', '))
		.replace('$families', newKara.data.families.map(t => t.name).join(', '))
		.replace('$genres', newKara.data.genres.map(t => t.name).join(', '))
		.replace('$origins', newKara.data.origins.map(t => t.name).join(', '))
		.replace('$duration', duration(newKara.data.mediaduration));
	try {
		if (conf.Gitlab.Enabled) return gitlabPostNewIssue(title, desc, conf.Gitlab.IssueTemplate.Import.Labels);
	} catch(err) {
		logger.error(`[KaraImport] Call to Gitlab API failed : ${err}`);
	}
}