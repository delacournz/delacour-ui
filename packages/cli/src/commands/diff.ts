import { readFile } from "node:fs/promises";
import * as clack from "@clack/prompts";
import { loadConfig } from "../config/resolve";
import { planFiles } from "../project/write-files";
import { createRegistryClient } from "../registry/client";
import type { RegistryItem } from "../registry/schema";
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
	const candidates = name
		? [name]
		: await installedItems(
				index.items.map((item) => item.name),
				config,
				client
			);

	if (candidates.length === 0) {
		output.info("No components from the registry are in this project yet.");
		return;
	}

	let changed = 0;

	for (const candidate of candidates) {
		const item = await client.getItem(candidate);
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
	item: RegistryItem,
	config: Awaited<ReturnType<typeof loadConfig>>,
	output: Output
): Promise<number> {
	const planned = await planFiles([item], config);
	let changed = 0;

	for (const file of planned) {
		if (!file.exists || file.unchanged) continue;

		const local = await readFile(file.path, "utf-8");
		const lines = diffLines(local, file.content);
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
 */
async function installedItems(
	names: readonly string[],
	config: Awaited<ReturnType<typeof loadConfig>>,
	client: ReturnType<typeof createRegistryClient>
): Promise<string[]> {
	const present: string[] = [];

	for (const name of names) {
		const item = await client.getItem(name);
		const planned = await planFiles([item], config);
		if (planned.some((file) => file.exists)) present.push(name);
	}

	return present;
}
