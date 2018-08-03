import {insertInstance, updateInstance, selectInstance} from '../_dao/shortener';

export async function publishInstance(ip, data) {
	const currentDate = new Date();
	const instance = await selectInstance(ip);
	if (instance.length > 0) {
		if (instance[0].instance_id === data.IID) {
			// Update
			await updateInstance({
				instance_id: data.IID,
				remote_ip: ip,
				date: currentDate,
				local_ip: data.localIP,
				local_port: data.localPort
			});
			return true;
		} else {
			// Error
			throw 'Instance not recognized';
		}
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

export async function getInstance(ip) {
	const instance = await selectInstance(ip);
	if (instance.length > 0) return instance[0];
	return false;
}