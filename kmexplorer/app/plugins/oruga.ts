import { Autocomplete, Collapse, Config, Dropdown, Table } from '@oruga-ui/oruga-next';
import { bulmaConfig } from '@oruga-ui/theme-bulma';

export default defineNuxtPlugin((nuxtApp) => {
	nuxtApp.vueApp
		.use(Config, { ...bulmaConfig, iconComponent: 'font-awesome-icon', iconPack: 'fas' })
		// Register only the components that are used
		.use(Autocomplete)
		.use(Collapse)
		.use(Dropdown)
		.use(Table);
});
