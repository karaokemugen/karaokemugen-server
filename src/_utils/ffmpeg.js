import execa from 'execa';
import logger from 'winston';
import {asyncRequired} from './files';
import {getConfig} from './config';
import {timeToSeconds} from './date';
import {resolve} from 'path';

export async function extractSubtitles(videofile, extractfile) {
	await execa(getConfig().Path.Bin.ffmpeg, ['-y', '-i', videofile, extractfile], {encoding: 'utf8'});

	// Verify if the subfile exists. If it doesn't, it means ffmpeg didn't extract anything
	return await asyncRequired(extractfile);
}

export async function createThumbnail(mediafile, percent, mediaduration, mediasize, uuid) {
	try {
		const conf = getConfig();
		const thumbnailWidth = 600;
		const time = Math.floor(mediaduration * (percent / 100));
		const previewfile = resolve(conf.appPath, conf.Path.Previews, `${uuid}.${mediasize}.${percent}.png`);
		await execa(getConfig().Path.Bin.ffmpeg, ['-ss', time, '-i', mediafile,  '-vframes', '1', '-filter:v', 'scale=\'min('+thumbnailWidth+',iw):-1\'', previewfile ], { encoding : 'utf8' });
	} catch(err) {
		logger.warn(`[ffmpeg] Unable to create preview for ${mediafile} : ${err.code}`);
	}
}

export async function getMediaInfo(mediafile) {
	try {
		const result = await execa(getConfig().Path.Bin.ffmpeg, ['-i', mediafile, '-vn', '-af', 'replaygain', '-f','null', '-'], { encoding : 'utf8' });
		const outputArray = result.stderr.split(' ');
		const indexTrackGain = outputArray.indexOf('track_gain');
		const indexDuration = outputArray.indexOf('Duration:');
		let audiogain = 0;
		let duration = 0;
		let error = false;
		if (indexTrackGain > -1) {
			let gain = parseFloat(outputArray[indexTrackGain + 2]);
			audiogain = gain.toString();
		} else {
			error = true;
		}

		if (indexDuration > -1) {
			duration = outputArray[indexDuration + 1].replace(',','');
			duration = timeToSeconds(duration);
		} else {
			error = true;
		}

		return {
			duration: duration,
			audiogain: audiogain,
			error: error
		};
	} catch(err) {
		logger.warn(`[ffmpeg] Video ${mediafile} probe error : ${err.code}`);
		return { duration: 0, audiogain: 0, error: true };
	}
}