export interface RemoteSettings {
	InstanceID: string,
	version: string
}

export type RemoteResponse = RemoteSuccess | RemoteFailure;

export interface RemoteSuccess {
	host: string,
	code: string
}

export interface RemoteFailure {
	err: true,
	reason: string
}
