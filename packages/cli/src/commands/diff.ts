import { access } from "node:fs/promises";
import { join } from "node:path";
import * as clack from "@clack/prompts";
import { loadConfig } from "../config/resolve";
import { planFiles } from "../project/write-files";
import { createRegistryClient } from "../registry/client";
import { isNamespace } from "../registry/namespaces";
import type { LoadedItem, RegistryIndexEntry } from "../registry/schema";
import { diffLines, hasChanges, toHunks } from "../ui/diff";
import { createOutput, type Output, style } from "../ui/output";

/**
 * Shows what has moved since the components were copied in.
 *
 * Read-only, and deliberately so. Once a component is in someone's repository
 * it is theirs, and the changes on each side are both legitimate — a fix
 * upstream and a tweak locally. Printing both and stopping is the only
 * behaviour that does not quietly pick a winner. `add --overwrite` takes the
 * registry's copy when that is what is wanted.
 */

export type DiffOptions = {
	cwd: string;
	silent?: boolean;
	ref?: string;
	registry?: string;
	offline?: boolean;
};

export async function diff(name: string | undefined, options: DiffOptions): Promise<void> {
	const output = createOutput(options);
	const config = await loadConfig(options.cwd);

	const client = createRegistryClient({
		cwd: options.cwd,
		url: options.registry ?? config.registry.url,
		ref: options.ref ?? config.registry.ref,
		offline: options.offline,
	});

	const index = await client.getIndex();
	const candidates = name ? [name] : await installedItems(index.items, config);

	if (candidates.length === 0) {
		output.info("No components from the registry are in this project yet.");
		return;
	}

	let changed = 0;

	for (const candidate of candidates) {
		const item = await client.loadItem(await client.getItem(candidate));
		changed += await reportItem(item, config, output);
	}

	if (changed === 0) {
		output.success("Everything matches the registry.");
		return;
	}

	const command = ["delacour add", name, "--overwrite"].filter(Boolean).join(" ");
	output.info(
		`${changed} file${changed === 1 ? " differs" : "s differ"}. ${style.code(command)} takes the registry's copy.`
	);
}

async function reportItem(
	item: LoadedItem,
	config: Awaited<ReturnType<typeof loadConfig>>,
	output: Output
): Promise<number> {
	const planned = await planFiles([item], config);
	let changed = 0;

	for (const file of planned) {
		if (file.current === null || file.unchanged) continue;

		const lines = diffLines(file.current, file.content);
		if (!hasChanges(lines)) continue;

		changed += 1;
		if (output.silent) continue;

		const body = toHunks(lines).flatMap((hunk) => [
			style.dim(`@@ -${hunk.before} +${hunk.after} @@`),
			...hunk.lines.map(render),
		]);

		clack.log.message([`${style.bold(item.name)} ${style.path(file.displayPath)}`, ...body].join("\n"));
	}

	return changed;
}

function render(line: { kind: "context" | "added" | "removed"; text: string }): string {
	if (line.kind === "added") return style.green(`+ ${line.text}`);
	if (line.kind === "removed") return style.red(`- ${line.text}`);
	return style.dim(`  ${line.text}`);
}

/**
 * Which registry items this project actually holds.
 *
 * Judged by the files on disk rather than by anything recorded at `add` time.
 * A lockfile of "what was installed" would be one more thing to drift from
 * reality, and the reality is right there in the directory.
 *
 * Answered from the index alone. Each entry already lists its files as
 * `<namespace>/<target>`, which is everything needed to test for one on disk —
 * so a bare `delacour diff` fetches one document and then only the items it
 * found, rather than the whole registry to discover the same thing.
 */
async function installedItems(
	entries: readonly RegistryIndexEntry[],
	config: Awaited<ReturnType<typeof loadConfig>>
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
function destination(file: string, config: Awaited<ReturnType<typeof loadConfig>>): string | null {
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
