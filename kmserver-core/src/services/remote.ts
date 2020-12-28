import express, { Express } from 'express';
import { resolve } from 'path';
import { v4 as uuidV4 } from 'uuid';
import logger from '../lib/utils/logger';
import { Socket } from 'socket.io';
import { generate } from 'randomstring';
import { getWS } from '../lib/utils/ws';
import { APIDataProxied } from '../lib/types/api';
import { asyncCheckOrMkdir, asyncReadFile } from '../lib/utils/files';
import { RemoteResponse, RemoteSettings } from '../lib/types/remote';
import { getConfig } from '../lib/utils/config';
import { getState } from '../utils/state';
import {
	deleteOldRemoteTokens,
	getRemoteByToken,
	insertNewToken,
	testCodeExistence,
	updateRemoteToken
} from '../dao/remote';
import { getVersion, watchRemotes } from '../utils/remote';

let app: Express;

let proxiedCodes: Set<string> = new Set();
// Room code -> Socket instance
let remotes: Map<string, Socket> = new Map();
// Socket instance -> Room code
let remotesReverse: WeakMap<Socket, string> = new WeakMap();
// Code -> KMFrontend version to serve
let remotesVersions: Map<string, string> = new Map();

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

async function findFreeCode() {
	let code = '';
	while (code === '') {
		code = generate({ charset: 'alphabetic', length: 4, readable: true, capitalization: 'lowercase' });
		if (await testCodeExistence(code)) {
			code = '';
		}
	}
	return code;
}

export async function startRemote(socket: Socket, req: RemoteSettings): Promise<RemoteResponse> {
	if (req.token) {
		const instance = await getRemoteByToken(req.token);
		if (instance) {
			try {
				// All good! Setup remote with the authenticated code
				updateRemoteToken(instance.token, socket.handshake.headers['x-forwarded-for']?.split(', ')[0] || socket.conn.remoteAddress).catch(err => {
					logger.warn('Cannot update instance last use', {service: 'Remote', obj: err});
				});
				setupRemote(instance.code, req.version, socket);
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
			logger.error('Cannot start remote and assign new token', {service: 'Remote', obj: err});
			return { err: true, reason: 'CANNOT_START' };
		}
	}
}

export function stopRemote(socket: Socket, reason?: string) {
	if (remotesReverse.has(socket)) {
		const code = remotesReverse.get(socket);
		logger.debug(`Stop remote for ${code} (hosted by ${socket.handshake.address})`, {service: 'Remote', obj: reason});
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
	}
}

export function proxyBroadcast(socket: Socket, data: any) {
	if (remotesReverse.has(socket)) {
		getWS().ws.of(remotesReverse.get(socket)).emit(data.type, data.data);
	}
}

function deleteOldRemote() {
	deleteOldRemoteTokens().then(() => {
		logger.info('Cleaned up expired tokens', {service: 'Remote'});
	}).catch(err => {
		logger.warn('Cannot delete old remote tokens (better luck next time)', {service: 'Remote', obj: err});
	});
}

export function initRemote() {
	app = express();
	app.use('/', (req: any, res, next) => {
		if (remotes.has(req.vhost[0])) {
			const frontend = getVersion(remotesVersions.get(req.vhost[0]));
			if (frontend) {
				return express.static(frontend,
					{ index: false })(req, res, next);
			} else {
				res.status(500).send('Cannot find KMFrontend required version.');
			}
		} else {
			next();
		}
	});
	app.use('/guests/', express.static(resolve(getState().appPath, 'assets/guestAvatars'),
		{ index: false, fallthrough: false }));
	app.get('/*', async (req: any, res, next) => {
		if (remotes.has(req.vhost[0])) {
			const frontend = getVersion(remotesVersions.get(req.vhost[0]));
			if (frontend) {
				let kmfrontend = await asyncReadFile(resolve(frontend, 'index.html'));
				kmfrontend = kmfrontend.toString().replace('NO-REMOTE', req.vhost[0]);
				res.send(kmfrontend);
			} else {
				res.status(500).send('Cannot find KMFrontend required version.');
			}
		} else {
			next();
		}
	});
	asyncCheckOrMkdir(getConfig().Remote.FrontendRoot);
	watchRemotes();
	deleteOldRemote();
	setTimeout(deleteOldRemote, 60 * 60 * 1000 * 24);
	return app;
}
