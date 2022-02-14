import Transport from 'winston-transport';

// Exporting empty class because we don't need that on KMServer
export class IPCTransport extends Transport {
	
}

export function emitIPC(type: string, data: any) {
	return { type, data };
}
