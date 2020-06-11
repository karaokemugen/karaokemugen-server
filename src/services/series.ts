import { getTags } from './tag';
import sentry from '../utils/sentry';

// This is a masquerade until KM <3.2 is deprecated

export async function getAllSeries(filter: string, from = 0, size = 9999999999) {
	try {
		const tags: any = await getTags({filter: filter, type: 1, from: from, size: size});
		for (const i in tags.content) {
			tags.content[i].sid = tags.content[i].tid;
			delete tags.content[i].tid;
			tags.content[i].seriefile = tags.content[i].tagfile;
			delete tags.content[i].tagfile;
		}
	} catch(err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
	}
}