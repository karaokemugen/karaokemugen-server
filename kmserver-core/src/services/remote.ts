import express, { Express } from 'express';
import { promises as fs } from 'fs';
import { resolve } from 'path';
import { generate } from 'randomstring';
import { Socket } from 'socket.io';
import { v4 as uuidV4 } from 'uuid';

import {
	deleteOldRemoteTokens,
	deleteToken,
	insertNewToken,
	selectRemoteTokens,
	updateRemoteToken,
	updateRemoteTokenCode
} from '../dao/remote.js';
import { APIDataProxied } from '../lib/types/api.js';
import { RemoteResponse, RemoteSettings } from '../lib/types/remote.js';
import {getConfig} from '../lib/utils/config.js';
import { asyncCheckOrMkdir } from '../lib/utils/files.js';
import logger from '../lib/utils/logger.js';
import { getWS } from '../lib/utils/ws.js';
import {resolvedPathRemoteRoot} from '../utils/config.js';
import { fetchRemote, getVersion, isRemoteAvailable, isRemoteDownloadable, watchRemotes } from '../utils/remote.js';
import sentry from '../utils/sentry.js';
import { getState } from '../utils/state.js';

const service = 'Remote';

let app: Express;

const proxiedCodes: Set<string> = new Set();
// Room code -> Socket instance
const remotes: Map<string, Socket> = new Map();
// Socket instance -> Room code
const remotesReverse: WeakMap<Socket, string> = new WeakMap();
// Code -> KMFrontend version to serve
const remotesVersions: Map<string, string> = new Map();

function nspMiddleware(client: Socket, next: () => void) {
	client.onAny((cmd, data, ack) => proxyHandler(client, client.nsp.name.substring(1), cmd, data, ack));
	next();
}

function setupRemote(code: string, version: string, socket: Socket) {
	remotes.set(code, socket);
	remotesReverse.set(socket, code);
	remotesVersions.set(code, version);
	if (!proxiedCodes.has(code)) {
		getWS().ws.of(code).use(nspMiddleware);
		proxiedCodes.add(code);
	}
}

export async function getTokens() {
	return selectRemoteTokens();
}

export async function removeToken(token: string) {
	return deleteToken(token);
}

export async function promoteToken(token: string, code: string) {
	return updateRemoteTokenCode(token, code);
}

async function findFreeCode() {
	let code = '';
	const tokens = await selectRemoteTokens();
	const codesSet = new Set(tokens.map(t => t.code));
	while (code === '') {
		code = generate({ charset: 'alphabetic', length: 4, readable: true, capitalization: 'lowercase' });
		if (codesSet.has(code)) code = '';
	}
	return code;
}

export async function startRemote(socket: Socket, req: RemoteSettings): Promise<RemoteResponse> {
	// Find out if we have the right version

	if (req.token) {
		const instance = (await selectRemoteTokens(req.token))[0];
		if (instance) {
			try {
				// All good! Setup remote with the authenticated code
				const forwarded = socket.handshake.headers['x-forwarded-for'] as string;
				updateRemoteToken(instance.token, forwarded?.split(', ')[0] || socket.conn.remoteAddress).catch(err => {
					logger.warn('Cannot update instance last use', {service, obj: err});
				});
				setupRemote(instance.code, req.version, socket);
				if (!isRemoteAvailable(req.version)) {
					if (!await isRemoteDownloadable(req.version)) {
						logger.error(`Frontend version ${req.version} is not available locally or remotely`, { service });
						throw new Error(); // Not sure if I shouldn't throw something else or not.
					}
					fetchRemote(req.version);
				}
				return {
					host: `${instance.code}.${getConfig().Remote.BaseHost}`,
					code: instance.code,
					token: instance.token
				};
			} catch (err) {
				return { err: true, reason: 'AUTHENTICATED_CANNOT_START' };
			}
		} else {
			// Token is probably expired, ask the app to request a new one
			return { err: true, reason: 'INVALID_TOKEN' };
		}
	} else {
		try {
			const code = await findFreeCode();
			const token = uuidV4();
			await insertNewToken(code, token, socket.handshake.address);
			setupRemote(code, req.version, socket);
			return { host: `${code}.${getConfig().Remote.BaseHost}`, code, token };
		} catch (err) {
			logger.error('Cannot start remote and assign new token', {service, obj: err});
			return { err: true, reason: 'CANNOT_START' };
		}
	}
}

export function stopRemote(socket: Socket, reason?: string) {
	if (remotesReverse.has(socket)) {
		const code = remotesReverse.get(socket);
		logger.debug(`Stop remote for ${code} (hosted by ${socket.handshake.address})`, {service, obj: reason});
		remotesReverse.delete(socket);
		remotesVersions.delete(code);
		remotes.delete(code);
	}
}

function proxyHandler(client: Socket, code: string, command: string, data: APIDataProxied, ack: Function) {
	// Retrieve server socket
	const server = remotes.get(code);
	if (server) {
		// Emit the command and send response
		data.headers = client.handshake.headers as any;
		server.emit(`proxy ${command}`, data, res => {
			if (ack) ack(res);
		});
	} else {
		if (ack) ack({err: true, data: 'Unknown namespace'});
		client.disconnect(true);
	}
}

export function proxyBroadcast(socket: Socket, data: any) {
	if (remotesReverse.has(socket)) {
		getWS().ws.of(remotesReverse.get(socket)).emit(data.type, data.data);
	}
}

function deleteOldRemote() {
	deleteOldRemoteTokens().then(() => {
		logger.info('Cleaned up expired tokens', {service});
	}).catch(err => {
		logger.warn('Cannot delete old remote tokens (better luck next time)', {service, obj: err});
		sentry.error(err, 'warning');
	});
}

export function initRemote() {
	app = express();
	app.use('/', (req: any, res, next) => {
		if (remotes.has(req.vhost[0])) {
			const frontend = getVersion(remotesVersions.get(req.vhost[0]));
			if (frontend) {
				return express.static(
frontend,
					{ index: false }
)(req, res, next);
			} 
				res.status(500).send('Cannot find KMFrontend required version.');
				sentry.error(`Unknown KM App version ${remotesVersions.get(req.vhost[0])} when starting remote`);
		} else {
			next();
		}
	});
	app.use('/guests/', express.static(
resolve(getState().appPath, 'assets/guestAvatars'),
		{ index: false, fallthrough: false }
));
	app.get('/*', async (req: any, res) => {
		if (remotes.has(req.vhost[0])) {
			const frontend = getVersion(remotesVersions.get(req.vhost[0]));
			if (frontend) {
				let kmfrontend = await fs.readFile(resolve(frontend, 'index.html'), 'utf-8');
				kmfrontend = kmfrontend.toString().replace('NO-REMOTE', req.vhost[0]);
				res.send(kmfrontend);
			} else {
				res.status(500).send('Cannot find KMFrontend required version.');
				sentry.error(`Unknown KM App version ${remotesVersions.get(req.vhost[0])} when starting remote`);
			}
		} else {
			res.status(410).send('This remote instance is not available.');
		}
	});
	asyncCheckOrMkdir(resolvedPathRemoteRoot());
	watchRemotes();
	deleteOldRemote();
	setTimeout(deleteOldRemote, 60 * 60 * 1000 * 24);
	return app;
}
