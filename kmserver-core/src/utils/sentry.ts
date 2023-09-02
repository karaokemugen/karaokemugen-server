import * as SentryNode from '@sentry/node';
import Transport from 'winston-transport';

import SentryLogger from '../lib/utils/sentry.js';

const Sentry = new SentryLogger(SentryNode);

export default Sentry;

export class SentryTransport extends Transport {
	log(info: any, callback: any) {
		// Testing for precise falseness. If errortracking is undefined or if getconfig doesn't return anything, errors are sent.
		if (!Sentry.SentryInitialized) {
			callback();
			return;
		}
		Sentry.addErrorInfo(info.level, `${info.message}`);
		callback();
	}
}
