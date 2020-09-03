export interface ShortTag {
	name: string,
	tid: string,
	slug: string
}

export interface serieSinger extends ShortTag {
	type: 'series' | 'singers'
}
