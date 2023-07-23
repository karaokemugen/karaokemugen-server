import { promises as fs } from 'node:fs';
import { extname, dirname } from 'node:path';
import { createRequire, builtinModules } from 'node:module';
import { readPackageUp } from 'read-pkg-up';
import replaceAsync from 'string-replace-async';
import klaw from 'klaw';
import { rimraf } from 'rimraf';
import { build } from 'esbuild';

let i = 1;

const transformImportsPlugin = {
	name: 'transform-imports',
	setup(build) {
		build.onLoad({ filter: /\.ts$/ }, async (args) => {
			const req = createRequire(args.path);
			const content = await fs.readFile(args.path, 'utf-8');
			const newContent = content
				.replace(/import ([A-Za-z0-9*{},\s]+) from ["']\.(.+).mjs.js["'];/g, (m, p1, p2) => `import ${p1} from ".${p2}.mjs";`);
			return {
				// Use object explodes for CJS modules
				contents: await replaceAsync(newContent, /import {([A-Za-z0-9*{},\s]+)} from ["']([^.;]+)["'];/g, async (m, payload, mod) => {
					// console.log({m, payload, mod});
					// Check if module is from Node stdlib.
					if (builtinModules.includes(mod)) return m;
					try {
						// Determine if module is ESM or not
						const path = req.resolve(mod);
						const pjson = await readPackageUp({ cwd: dirname(path) });
						if (!(typeof pjson.packageJson.module === 'string' || pjson.packageJson.type === 'module' || typeof pjson.packageJson.exports === 'object')) {
							// It's CJS!
							// Reformat imports
							const newPayload = payload.replace(/([a-zA-Z0-9]+) as ([a-zA-Z0-9]+)/g, '$1: $2');
							const out = `import plugin${i} from "${mod}";\nconst {${newPayload}} = plugin${i}`;
							++i;
							return out;
						} else return m; // It's ESM, do not replace
					} catch (err) {
						console.warn(`--- ${mod} @ ${args.path} was not resolved properly, not fatal if package present for type purposes. ---`);
						return m;
					}
				}),
				loader: 'ts'
			}
		});
	},
}

console.log('Clearing dist/');
await rimraf('dist/');

const entryPoints = [];
for await (const file of klaw('src')) {
	if (extname(file.path) === '.ts') entryPoints.push(file.path);
}

await build({
	outdir: 'dist',
	entryPoints,
	platform: 'node',
	target: 'node16',
	color: true,
	logLevel: 'info',
	plugins: [transformImportsPlugin],
	sourcemap: 'linked'
});
