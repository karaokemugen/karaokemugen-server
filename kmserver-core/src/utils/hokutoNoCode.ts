import fs from 'node:fs/promises';
import { resolve } from 'node:path';

import { resolvedPath } from '../lib/utils/config.js';
import logger from '../lib/utils/logger.js';
import { createPreviews } from '../services/kara.js';

/**
 * "You don't know it yet but you're already dead."
 * 
 * This code is meant in special cases for migrations for example and is bound to be removed someday. Treat it well while it's still there with us.
 * 
 * When adding code here, label it with an idea of when you're going to remove it. No need to be precise.
 */


// Remove in KMServer in something like early 2027.

const service = 'HokutoNoCode';

export async function removeJPGPreviews() {    
    const previewFiles = await fs.readdir(resolvedPath('Previews'));
    if (previewFiles.find(f => f.endsWith('.jpg'))) {
        logger.info ('Removing JPG previews in favor of AVIF ones', { service });
        for (const file of previewFiles) {
            try {
                if (file.endsWith('.jpg')) await fs.unlink(resolve(resolvedPath('Previews'), file));
            } catch (err) {
                // Non-fatal
                logger.error(`Unable to remove preview ${file}`, { service })
            }
        }   
        // Since we found jpg previews, start a new generation of previews
        await createPreviews();
    }    
}