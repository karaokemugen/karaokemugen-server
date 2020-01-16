import {cleanupInstances, insertInstance, updateInstance, selectInstance} from '../dao/shortener';
import logger from 'winston';
import {getConfig} from '../lib/utils/config';
import { InstanceData } from '../types/shortener';

export async function publishInstance(ip: string, data: InstanceData) {
	const currentDate = new Date();
	logger.debug(`[Shortener] Received publish request from ${ip} with ${JSON.stringify(data)}`);
	const instance = await selectInstance(ip);
	logger.debug(`[Shortener] Instance found : ${JSON.stringify(instance)}`);
	if (instance.length > 0) {
		await updateInstance({
			instance_id: data.IID,
			remote_ip: ip,
			date: currentDate,
			local_ip: data.localIP,
			local_port: data.localPort
		});
		return true;
	} else {
		await insertInstance({
			instance_id: data.IID,
			remote_ip: ip,
			date: currentDate,
			local_ip: data.localIP,
			local_port: data.localPort
		});
		return true;
	}
}

export async function getInstance(ip: string) {
	logger.debug(`[Shortener] Received get request from ${ip}`);
	const instance = await selectInstance(ip);
	logger.debug(`[Shortener] Found instance data ${JSON.stringify(instance)}`);
	if (instance.length > 0) return instance[0];
	return false;
}

export async function initShortener() {
	setInterval(cleanInstances, 60 * 60 * 1000 * 24 * getConfig().Shortener.ExpireTimeDays);
	cleanInstances();
}

async function cleanInstances() {
	// Unflag online accounts from database if they expired
	try {
		const date = new Date();
		date.setDate(date.getDate() - getConfig().Shortener.ExpireTimeDays);
		await cleanupInstances(date);
		logger.info('[Shortener] Cleaned up expired instances')
	} catch(err) {
		logger.error(`[Shortener] Expiring instances failed (better luck next time) : ${err}`);
	}
}