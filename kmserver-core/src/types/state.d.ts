export interface State {
	appPath?: string,
	dataPath?: string,
	resourcePath?: string,
	originalAppPath?: string,
	defaultLocale?: string,
	electron?: any,
	os?: string,
	osHost?: string,
	wsLogNamespace?: string,
	isTest?: boolean,
	acceptedLanguages?: string[],
	version?: {
		number?: string,
		name?: string,
		sha?: string,
	},
	binPath?: {
		ffmpeg?: string,
		git?: string
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
