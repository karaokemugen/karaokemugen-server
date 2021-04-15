import execa from 'execa';
import {version} from '../kmserver-core/src/version';

// Create the release if it doesn't exists
execa.commandSync(`yarn sentry-cli --auth-token ${process.env.SENTRYTOKEN} releases --org karaoke-mugen -p km-server new ${version.number}`,
	{stdout: 'inherit', stderr: 'inherit'});

execa.command(`yarn sentry-cli --auth-token ${process.env.SENTRYTOKEN} releases --org karaoke-mugen -p km-server files ${version.number} upload-sourcemaps --no-rewrite dist/`,
	{stdout: 'inherit', stderr: 'inherit'});

execa.command(`yarn sentry-cli --auth-token ${process.env.SENTRYTOKEN} releases --org karaoke-mugen -p km-server set-commits --commit Karaoke\\ Mugen\\ /\\ Karaoke\\ Mugen\\ Server@${process.env.CI_COMMIT_SHA} ${version.number}`,
	{stdout: 'inherit', stderr: 'inherit'});

// If tagged, deploy release
if (process.env.CI_COMMIT_TAG) {
	execa.command(`yarn sentry-cli --auth-token ${process.env.SENTRYTOKEN} releases --org karaoke-mugen -p km-server deploys ${version.number} new -e release`,
		{stdout: 'inherit', stderr: 'inherit'});
}
