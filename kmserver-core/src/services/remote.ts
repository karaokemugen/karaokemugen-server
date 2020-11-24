import express, { Express } from 'express';
import { resolve } from 'path';
import { v4 as uuidV4 } from 'uuid';
import logger from '../lib/utils/logger';
import { getState } from '../utils/state';
import { Socket } from 'socket.io';
import { generate } from 'randomstring';
import { getWS } from '../lib/utils/ws';
import { APIDataProxied } from '../lib/types/api';
import { asyncReadFile } from '../lib/utils/files';
import { RemoteResponse } from '../lib/types/remote';
import {getConfig} from '../lib/utils/config';
import {
	deleteOldRemoteTokens,
	getRemoteByToken,
	insertNewToken,
	testCodeExistence,
	updateRemoteToken
} from '../dao/remote';

let app: Express;

let proxiedCodes: Set<string> = new Set();
let remotes: Map<string, Socket> = new Map();
let remotesIPs: Map<string, string> = new Map();

function nspMiddleware(client: Socket, next: () => void) {
	client.onAny((cmd, data, ack) => proxyHandler(client, client.nsp.name.substring(1), cmd, data, ack));
	next();
}

function setupRemote(code: string, socket: Socket) {
	remotes.set(code, socket);
	remotesIPs.set(socket.handshake.address, code);
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

export async function startRemote(socket: Socket, _instanceId: string, token: string): Promise<RemoteResponse> {
	if (token) {
		const instance = await getRemoteByToken(token);
		if (instance) {
			try {
				// All good! Setup remote with the authenticated code
				updateRemoteToken(instance.token, socket.handshake.address).catch(err => {
					logger.warn('Cannot update instance last use', {service: 'Remote', obj: err});
				});
				setupRemote(instance.code, socket);
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
			setupRemote(code, socket);
			return { host: `${code}.${getConfig().Remote.BaseHost}`, code, token };
		} catch (err) {
			logger.error('Cannot start remote and assign new token', {service: 'Remote', obj: err});
			return { err: true, reason: 'CANNOT_START' };
		}
	}
}

export function stopRemote(socket: Socket) {
	if (remotesIPs.has(socket.handshake.address)) {
		const code = remotesIPs.get(socket.handshake.address);
		remotesIPs.delete(socket.handshake.address);
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
			ack(res);
		});
	} else {
		ack({err: true, data: 'Unknown namespace'});
	}
}

export function proxyBroadcast(socket: Socket, data: any) {
	if (remotesIPs.has(socket.handshake.address)) {
		getWS().ws.of(remotesIPs.get(socket.handshake.address)).emit(data.type, data.data);
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
	app.use('/', express.static(resolve(getState().appPath, 'kmapp-remote/kmfrontend/build'), { index: false }));
	app.get('/*', async (req: any, res, next) => {
		if (remotes.has(req.vhost[0])) {
			let kmfrontend = await asyncReadFile(resolve(getState().appPath, 'kmapp-remote/kmfrontend/build/index.html'));
			kmfrontend = kmfrontend.toString().replace('NO-REMOTE', req.vhost[0]);
			res.send(kmfrontend);
		} else {
			next();
		}
	});
	deleteOldRemote();
	setTimeout(deleteOldRemote, 60 * 60 * 1000 * 24);
	return app;
}
