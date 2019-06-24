export interface State {
	appPath?: string,
	EngineDefaultLocale?: string,
	version?: {
		number?: string,
		name?: string,
	},
	binPath?: {
		ffmpeg?: string,
	},
	opt?: {
		generateDB?: boolean,
		reset?: boolean,
		strict?: boolean,
		noMedia?: boolean,
		profiling?: boolean,
		sql?: boolean,
		validate?: boolean,
		debug?: boolean
	}
}
