import Transport from 'winston-transport';

//Exporting empty class because we don't need that on KMServer
export class IPCTransport extends Transport{
	constructor(opts: any) {
		super(opts);
	}
}

export function emitIPC(type: string, data: any) {
	return { type, data };
}