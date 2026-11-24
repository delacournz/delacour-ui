import { readdir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";

/**
 * The project's own files that still name the root provider by its old name.
 *
 * Renaming `prefix` renames `DelacourProvider` in the copied provider, and the app that imports it
 * by that name stops compiling. Those imports are the project's code, so `update` lists them rather
 * than editing them. The copied components themselves (`skip`, each namespace's directory), build
 * output and native folders are not the project's to fix and are left out.
 */

const SOURCE = /\.(?:[cm]?[jt]sx?)$/;
const IGNORED = new Set(["node_modules", ".git", ".expo", ".turbo", "dist", "build", "ios", "android", "coverage"]);

export async function findProviderReferences(
	root: string,
	skip: readonly string[],
	provider: string
): Promise<string[]> {
	const name = new RegExp(`\\b${provider}(?:Props)?\\b`);
	const skipped = skip.map((path) => `${path.replace(/[/\\]+$/, "")}${sep}`);
	const isSkipped = (path: string) => skipped.some((prefix) => `${path}${sep}`.startsWith(prefix));
	const mentions = async (path: string) => SOURCE.test(path) && name.test(await readFile(path, "utf-8"));
	const found: string[] = [];

	const walk = async (directory: string): Promise<void> => {
		const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);

		for (const entry of entries) {
			const path = join(directory, entry.name);
			if (isSkipped(path)) continue;

			if (entry.isDirectory() && !IGNORED.has(entry.name)) await walk(path);
			if (entry.isFile() && (await mentions(path))) found.push(relative(root, path).split(sep).join("/"));
		}
	};

	await walk(root);
	return found.sort();
}
