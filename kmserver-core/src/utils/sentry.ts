import * as SentryNode from '@sentry/node';
import Transport from 'winston-transport';

import SentryLogger from '../lib/utils/sentry';

let Sentry = new SentryLogger(SentryNode);

export default Sentry;

export class SentryTransport extends Transport {
	constructor(opts: any) {
		super(opts);
	}

	log(info: any, callback: any) {
		// Testing for precise falseness. If errortracking is undefined or if getconfig doesn't return anything, errors are sent.
		if (!Sentry.SentryInitialized) {
			callback();
			return;
		}
		if (info.level === 'debug') Sentry.addErrorInfo('debug', `${info.message}`);
		callback();
	}
}