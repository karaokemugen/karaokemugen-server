export interface ShortURLData {
	date: Date,
	remote_ip: string | string[],
	local_ip: string,
	local_port: number,
	instance_id: string
}

export interface InstanceData {
	IID: string,
	localIP: string,
	localPort: number
}