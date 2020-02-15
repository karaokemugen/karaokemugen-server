export interface State {
	appPath?: string,
	dataPath?: string,
	resourcePath?: string
	EngineDefaultLocale?: string,
	os?: string,
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
		debug?: boolean,
		staticServe?: boolean
	}
}
