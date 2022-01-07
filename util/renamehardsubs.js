const kpath = 'app/karaokebase/karaokes';
const lpath = 'app/karaokebase/lyrics';
const hardsubs = 'app/hardsubs';

const fs = require('fs/promises');
const {createHash} = require('crypto');
const { resolve, extname } = require('path');

async function md5Ass(path) {
    let ass = await fs.readFile(path, {encoding: 'utf-8'}).catch(reason => {
        if (reason.code === 'ENOENT') {
			console.log('No ASS file for ' +path);
            return 'no_ass_file';
        } else {
            throw reason;
        }
    });
    if (ass === 'no_ass_file') {
        return ass;
    } else {
        ass = ass.replace(/\r/g, '');
        return createHash('md5').update(ass, 'utf-8').digest('hex');
    }
}

async function main() {
	const karaFiles = await fs.readdir(kpath);
	const hsFiles = await fs.readdir(hardsubs);
	for (const karaFile of karaFiles) {
		const karaData = await fs.readFile(resolve(kpath, karaFile));
		const kara = JSON.parse(karaData);
		const mediafile = kara.medias[0].filename;
		const mediasize = kara.medias[0].filesize;
		const subfile = kara.medias[0].lyrics[0]?.filename;
		const md5 = await md5Ass(resolve(lpath, subfile || 'no_ass.txt'));
		const ext = extname(mediafile);
		const hsFile = mediafile.replace(ext, `.${mediasize}.${md5}.mp4`)
		if (hsFiles.includes(hsFile)) {
			console.log(`${kara.data.kid}.${mediasize}.${md5}.mp4`);
			await fs.rename(resolve(hardsubs, hsFile), resolve(hardsubs, `${kara.data.kid}.${mediasize}.${md5}.mp4`));
		}
	}
}

main().catch(err => console.log(err));