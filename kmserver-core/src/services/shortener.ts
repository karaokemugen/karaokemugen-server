import {cleanupInstances, upsertInstance, selectInstance, removeInstances, bootClearInstances} from '../dao/shortener';
import logger from 'winston';
import {getConfig} from '../lib/utils/config';
import { InstanceData } from '../types/shortener';
import {isIPv6} from 'net';
import sentry from '../utils/sentry';

export async function publishInstance(ip: string, data: InstanceData) {
	try {
		if (!data.IID) {
			// WTF. Ignoring for now, data didn't have any instance ID
			logger.debug(`Ignoring ${ip} because of invalid IID`, {service: 'Shortener', obj: data});
			return false;
		}
		// Find cheaters; people who will publish for others IPs
		if (ip !== data?.IP6 && ip !== data?.IP4) {
			logger.debug(`${ip} is pretending to be ${JSON.stringify([data?.IP4, data?.IP6])}`, {service: 'Shortener', obj: data});
			return false;
		}
		const currentDate = new Date();
		logger.debug(`Received publish request from ${ip}`, {service: 'Shortener', obj: data});
		const instance = await selectInstance(ip);
		logger.debug('Instance(s) found', {service: 'Shortener', obj: instance});
		if (isIPv6(ip)) {
			await upsertInstance({
				instance_id: data.IID,
				remote_ip4: data?.IP4, // Imaginons que qqun soit assez fou pour vivre avec que la V6 en 2020
				date: currentDate,
				local_ip4: data.localIP4,
				local_port: data.localPort,
				ip6_prefix: data.IP6Prefix,
				ip6: ip
			});
			return true;
		} else {
			await upsertInstance({
				instance_id: data.IID,
				remote_ip4: ip,
				date: currentDate,
				local_ip4: data.localIP4 ? data.localIP4:data.localIP,
				local_port: data.localPort,
				ip6_prefix: data?.IP6Prefix || 'fe80::/56',
				ip6: data?.IP6 || 'fe80::1' // Assume default addresses to avoid some disasters
			});
			return true;
		}
	} catch(err) {
		logger.error('Failed to publish instance', {service: 'Shortener', obj: err});
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	}
}

export async function getInstance(ip: string) {
	try {
		logger.debug(`Received get request from ${ip}`, {service: 'Shortener'});
		const instance = await selectInstance(ip);
		logger.debug('Found instance data', {service: 'Shortener', obj: instance});
		if (instance.length > 0) return instance[0];
		else return false;
	} catch(err) {
		sentry.addErrorInfo('args', JSON.stringify(arguments, null, 2));
		sentry.error(err);
		throw err;
	}
}

export async function removeInstance(ip: string) {
	try {
		logger.debug('Removing instance', {service: 'Shortener', obj: ip});
		await removeInstances(ip);
	} catch (e) {
		logger.error('Cannot remove instance', {service: 'Shortener'});
		sentry.error(e);
		throw e;
	}
}

export async function initShortener() {
	setInterval(cleanInstances, 60 * 60 * 1000 * 24 * getConfig().Shortener.ExpireTimeDays);
	await cleanInstances();
	await clearInstances();
}

async function clearInstances() {
	// Remove instances from shortener after boot.
	try {
		await bootClearInstances();
	} catch(err) {
		logger.error('Expiring instances failed (better luck next time)', {service: 'Shortener', obj: err});
		sentry.error(err, 'Warning');
	}
}

async function cleanInstances() {
	// Remove legacy instances from shortener
	try {
		const date = new Date();
		date.setDate(date.getDate() - getConfig().Shortener.ExpireTimeDays);
		await cleanupInstances(date);
		logger.info('Cleaned up expired instances', {service: 'Shortener'});
	} catch(err) {
		logger.error('Expiring instances failed (better luck next time)', {service: 'Shortener', obj: err});
		sentry.error(err, 'Warning');
	}
}
