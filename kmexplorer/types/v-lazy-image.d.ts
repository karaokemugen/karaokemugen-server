declare module 'v-lazy-image' {
	// TODO: complete the types declaration
	import Vue, { ComponentOptions } from 'vue';

	interface ComponentData {
		observer?: IntersectionObserver | null,
		intersected: boolean,
		loaded: boolean
	}

	const VLazyImage: ComponentOptions<Vue, ComponentData>;

	export default VLazyImage;
}
