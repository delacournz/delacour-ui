import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/** Every `.ts`/`.tsx` under `dir`, tests included unless `skipTests`. */
export function sourceFiles(dir: string, options: { skipTests?: boolean } = {}): string[] {
	const found: string[] = [];
	const walk = (current: string): void => {
		for (const entry of readdirSync(current)) {
			const path = join(current, entry);
			if (statSync(path).isDirectory()) {
				walk(path);
				continue;
			}
			if (!/\.tsx?$/.test(entry)) continue;
			if (options.skipTests && /\.test\.tsx?$/.test(entry)) continue;
			found.push(path);
		}
	};
	walk(dir);
	return found;
}

export const SRC = import.meta.dir;
export const PACKAGE_ROOT = join(SRC, "..");

export function read(path: string): string {
	return readFileSync(path, "utf8");
}

/** `path` relative to the package, for a failure message that can be acted on. */
export function relative(path: string): string {
	return path.slice(PACKAGE_ROOT.length + 1);
}
