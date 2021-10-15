import { getConfig } from '../lib/utils/config';

export function getRepo(repoName: string) {
	return getConfig().System.Repositories.find(r => r.Name === repoName);
}