import { getConfig, setConfig } from '../lib/utils/config.js';

export function getRepo(repoName: string) {
	return getConfig().System.Repositories.find(r => r.Name === repoName);
}

export function initRepos() {
	// Create Staging repo if necessary
	if (getConfig().System.Repositories.findIndex(r => r.Name === 'Staging' && !r.Online) === -1) {
		setConfig({
			System: {
				Repositories: [
					...getConfig().System.Repositories,
					{
						Name: 'Staging',
						Enabled: true,
						Online: false,
						BaseDir: 'repos/staging/data',
						Path: {
							Medias: ['repos/staging/medias']
						}
					}
				]
			}
		});
	}
}
