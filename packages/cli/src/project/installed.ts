import { access } from "node:fs/promises";
import { join } from "node:path";
import type { ResolvedConfig } from "../config/resolve";
import { isNamespace } from "../registry/namespaces";
import type { RegistryIndexEntry } from "../registry/schema";

/**
 * Which registry items this project actually holds.
 *
 * Judged by the files on disk, not by the lock. The lock says where a file came
 * from; it is not the list of what is here, and a project that copied its
 * components before there was a lock still holds them.
 *
 * Answered from the index alone. Each entry already lists its files as
 * `<namespace>/<target>`, which is everything needed to test for one on disk —
 * so a bare `delacour diff` fetches one document and then only the items it
 * found, rather than the whole registry to discover the same thing.
 */
export async function installedItems(
	entries: readonly RegistryIndexEntry[],
	config: ResolvedConfig
): Promise<string[]> {
	const present: string[] = [];

	for (const entry of entries) {
		const paths = entry.files.map((file) => destination(file, config)).filter((path) => path !== null);
		const found = await Promise.all(paths.map(exists));

		if (found.some(Boolean)) present.push(entry.name);
	}

	return present;
}

/** `"ui/button/button.tsx"` → where that file would land, or `null` for an unknown namespace. */
function destination(file: string, config: ResolvedConfig): string | null {
	const slash = file.indexOf("/");
	if (slash === -1) return null;

	const namespace = file.slice(0, slash);
	if (!isNamespace(namespace)) return null;

	return join(config.directories[namespace], file.slice(slash + 1));
}

async function exists(path: string): Promise<boolean> {
	return access(path).then(
		() => true,
		() => false
	);
}
