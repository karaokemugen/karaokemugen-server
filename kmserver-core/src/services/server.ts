import { selectServers, updateBanServer, upsertServer } from '../dao/server.js';
import { getConfig } from '../lib/utils/config.js';
import { ErrorKM } from '../lib/utils/error.js';
import HTTP from '../lib/utils/http.js';
import logger from '../lib/utils/logger.js';
import { KMServer } from '../types/database/server.js';

const service = 'KMServerUplink';

export async function addServer(kmServer: KMServer) {
	return upsertServer({
		domain: kmServer.domain,
		sid: kmServer.sid,
		last_seen: null // is updated by postgres,
	});
}

export async function getServers(publicView = false) {
	return selectServers(publicView);
}

export async function banServer(domain: string, banned = true) {
	const servers = await getServers();
	const server = servers.find(s => s.domain === domain);
	if (server) {
		await updateBanServer(domain, banned);
		logger.info(`Server ${domain} ${!banned ? 'un' : ''}banned`, {service});
	} else {
		throw new ErrorKM('UNKNOWN_SERVER', 404, false);
	}
}

export async function sendHeartbeat() {
	const conf = getConfig();
	const servers = conf.App.MasterServersUplink;
	const sid = conf.App.InstanceID;
	const domain = conf.Frontend.Host;
	if (!servers) return;
	for (const server of servers) {
		try {
			await HTTP.post(`https://${server}/api/uplink/heartbeat`, {
				domain,
				sid,
			});
		} catch (err) {
			logger.error(`Unable to send heartbeat to master server ${server} : ${err}`, { service });
		}
	}
}

export async function initUplink() {
	const servers = getConfig().App.MasterServersUplink;
	if (!servers) {
		logger.info('No master servers to uplink to', { service });
		return;
	}
	// Send a heartbeat every 24 hours.
	setInterval(sendHeartbeat, 1000 * 3600 * 24);
	sendHeartbeat();
}