// Instances are not stored in database but in an object since it doesn't need to be persistent

const instances = [];

export function getInstances() {
	return instances;
}

export function findInstance(id) {
	let instanceIndex;
	const instanceFound = instances.some((i, index) => {
		instanceIndex = index;
		return i.id === id;
	});
	if (instanceFound) return instanceIndex;
	return null;
}

export function getInstance(id) {
	const index = findInstance(id);
	if (index !== null) return instances[index];
	return null;
}

export function getInstanceRoom(room) {
	let instanceIndex;
	const instanceFound = instances.some((i, index) => {
		instanceIndex = index;
		return i.room === room;
	});
	if (instanceFound) return instances[instanceIndex];
}

export function upsertInstance(id, port?, room?) {
	const index = findInstance(id);
	if (index !== null) delete instances[index];
	instances.push({
		id: id,
		room: room,
		port: port
	});
}

export function removeInstance(id) {
	const index = findInstance(id);
	if (index) delete instances[index];
}
