export interface Instance {
	instance_id: string,
	version: string,
	locale?: string,
	screens?: number,
	cpu_manufacturer?: string,
	cpu_model?: string,
	cpu_speed?: any,
	cpu_cores?: number,
	memory?: number,
	total_disk_size?: number,
	os_platform?: string,
	os_distro?: string,
	os_release?: string,
	config: any
}

export interface Favorite {
	kid: string
}

export interface AnimeLists {
	myanimelistIds: number[]
	anilistIds: number[]
	kitsuIds: number[]
}

export interface Played {
	kid: string,
	seid: string,
	played_at: Date
}

export interface Session {
	seid: string,
	started_at: Date,
	name: string,
	ended_at: Date,
}

export interface Requested {
	kid: string,
	seid: string,
	requested_at: Date
}

export interface Payload {
	payloadVersion: number,
	instance: Instance,
	viewcounts: Played[],
	favorites: Favorite[],
	requests: Request[]
}