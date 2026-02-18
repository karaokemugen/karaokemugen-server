import * as SentryNode from '@sentry/node';
import Transport from 'winston-transport';

import { getConfig } from '../lib/utils/config.js';
import SentryLogger from '../lib/utils/sentry.js';
import { getState } from './state.js';

class NodeSentryLogger extends SentryLogger {
	init() {
		if (process.env.CI_SERVER || process.env.SENTRY_TEST === 'true') {
			console.log('CI detected/SENTRY_TEST present - Sentry disabled');
			console.log("Have a nice day, sentries won't fire at you~");
			return;
		}
		if (!process.env.SENTRY_DSN) {
			// No DSN provided, return.
			return;
		}
		this.Sentry.init({
			dsn: process.env.SENTRY_DSN,
			environment: process.env.SENTRY_ENVIRONMENT || 'release',
			release: getState().version.number,
			dist: getState().version.sha,
			ignoreErrors: [
				'[nuxt] instance unavailable'
			],
			beforeSend: (event, _hint) => {
				// Testing for precise falseness. If errortracking is undefined or if getconfig doesn't return anything, errors are not sent.
				if (
					getConfig()?.Online?.ErrorTracking !== true ||
					!this.SentryInitialized
				)
					return null;
				return event;
			},
		});
		this.SentryInitialized = true;
	}
}

const Sentry = new NodeSentryLogger(SentryNode);
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
