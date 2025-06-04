import { WSCmdDefinition } from '../lib/types/frontend.js';
import { RemoteResponse, RemoteSettings } from '../lib/types/remote.js';

export function defineWSCmd<Body extends object, Response>(value: string): WSCmdDefinition<Body, Response> {
	return { value, bodyType: {} as Body, responseType: {} as Response };
}

export const WS_CMD = {
	// AREA src\controllers\ws\remote.ts
	REMOTE_START: defineWSCmd<RemoteSettings, RemoteResponse>('remote start'),
	REMOTE_STOP: defineWSCmd<undefined, void>('remote stop'),
	REMOTE_BROADCAST: defineWSCmd<undefined, boolean>('remote broadcast'),
	PING: defineWSCmd<undefined, boolean>('ping'),
	// AREA src\controllers\ws\user.ts
	SUBSCRIBE_USER: defineWSCmd<undefined, boolean>('subscribe user'),
	UNSUBSCRIBE_USER: defineWSCmd<undefined, boolean>('unsubscribe user'),
} as const;
