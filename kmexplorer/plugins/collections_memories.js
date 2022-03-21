export default function ({ store, route }) {
	const collections = window.localStorage.getItem('enabled_collections');
	if (collections && route.name !== 'search-query') {
		store.commit('menubar/setEnabledCollections', collections.split(':'));
	}
}
