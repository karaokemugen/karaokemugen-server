import express, { Express } from 'express';
import { resolve } from 'path';
import { getState } from '../utils/state';
import { Socket } from 'socket.io';
import { generate } from 'randomstring';
import { getWS } from '../lib/utils/ws';
import { APIData } from '../lib/types/api';
import { asyncReadFile } from '../lib/utils/files';
import { RemoteResponse } from '../types/remote';
import {getConfig} from '../lib/utils/config';

let app: Express;

let usedCodes: Set<string> = new Set();
let remotes: Map<string, Socket> = new Map();
let remotesIPs: Map<string, string> = new Map();
// let remotesToken: Map<string, string> = new Map();

export function startRemote(socket: Socket, _instanceId: string): RemoteResponse {
	/*if (remotesCache.has(instanceId) && remotesIPs.has(socket.handshake.address)) {
		if (remotesIPs.get(socket.handshake.address) === instanceId) {
			const code = remotesCache.get(instanceId);
			if (remotes.has(code)) {
				logger.warn('Start remote on an already remote-enabled instance', {service: 'Remote'});
				return { err: true, reason: '' };
			} else {
				setupRemote(code, socket);
				return { host: `${code}.${getConfig().Remote.BaseHost}`, code };
			}
		} else {
			logger.warn('InstanceID has multiple IPs, reset code to avoid impersonation', {service: 'Remote'});
		}
	} else {
		let code = '';
		while (code === '') {
			code = generate({ charset: 'alphabetic', length: 6, readable: true, capitalization: 'lowercase' });
			if (remotes.has(code)) {
				code = '';
			}
		}
		remotesCache.set(instanceId, code);
		remotesIPs.set(socket.handshake.address, instanceId);
		setupRemote(code, socket);
		return { host: `${code}.${getConfig().Remote.BaseHost}`, code };
	}*/
	let code = '';
	while (code === '') {
		code = generate({ charset: 'alphabetic', length: 4, readable: true, capitalization: 'lowercase' });
		if (usedCodes.has(code)) {
			code = '';
		}
	}
	remotes.set(code, socket);
	remotesIPs.set(socket.handshake.address, code);
	setupRemote(code);
	return { host: `${code}.${getConfig().Remote.BaseHost}`, code };
}

export function stopRemote(socket: Socket) {
	if (remotesIPs.has(socket.handshake.address)) {
		const code = remotesIPs.get(socket.handshake.address);
		remotesIPs.delete(socket.handshake.address);
		remotes.delete(code);
	}
}

function nspMiddleware(client: Socket, next: () => void) {
	client.onAny((cmd, data, ack) => proxyHandler(client, client.nsp.name.substring(1), cmd, data, ack));
	next();
}

export function setupRemote(code) {
	if (!usedCodes.has(code)) {
		getWS().ws.of(code).use(nspMiddleware);
		usedCodes.add(code);
	}
}

function proxyHandler(client: Socket, code: string, command: string, data: APIData, ack: Function) {
	// Retrieve server socket
	const server = remotes.get(code);
	if (server) {
		// Emit the command and send response
		(data as any).headers = client.handshake.headers;
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
	return app;
}
