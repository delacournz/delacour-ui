import { readFile, writeFile } from "node:fs/promises";

/**
 * Saves the answer to "also install component tests?" as `tests.enabled`.
 *
 * Edits the parsed JSON rather than the text, so every other key survives and
 * the file keeps the tab indentation `init` wrote. Comments are not a concern:
 * `native-components.json` is plain JSON, and `readConfig` parses it as such.
 * Returns whether the file changed, so a caller writes nothing for a no-op.
 */
export async function persistTestsEnabled(configPath: string, enabled: boolean): Promise<boolean> {
	const raw = JSON.parse(await readFile(configPath, "utf-8")) as Record<string, unknown>;
	const tests = isRecord(raw.tests) ? raw.tests : {};
	if (tests.enabled === enabled) return false;

	await writeFile(configPath, `${JSON.stringify({ ...raw, tests: { ...tests, enabled } }, null, "\t")}\n`, "utf-8");
	return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
