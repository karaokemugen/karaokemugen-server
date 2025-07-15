export interface KMServer {
	domain: string;
	sid: string;
	last_seen: Date;
	flag_banned?: boolean;
}