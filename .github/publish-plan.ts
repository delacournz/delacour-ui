/**
 * Reading `changeset publish-plan` and finding the packages it names, for
 * `.github/changeset-alpha.ts`.
 *
 * The stable line does not use this: `release.yml` packs and publishes the four
 * `fixed` packages by name. The alpha line publishes whatever a snapshot
 * version bumped, so it asks Changesets for the plan.
 */
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

export type PublishRelease = {
	kind: "publish";
	name: string;
	version: string;
	access: "public" | "restricted";
	tag: string;
};

export type TagOnlyRelease = {
	kind: "tag-only";
	name: string;
	version: string;
};

export type Release = PublishRelease | TagOnlyRelease;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRelease(value: unknown): value is Release {
	if (!isRecord(value)) return false;
	if (typeof value.name !== "string" || typeof value.version !== "string") return false;
	if (value.kind === "tag-only") return true;
	return (
		value.kind === "publish" &&
		(value.access === "public" || value.access === "restricted") &&
		typeof value.tag === "string"
	);
}

/**
 * Validates the file `changeset publish-plan --output` writes. Throws on any
 * shape it does not recognise rather than publishing from a guess.
 */
export function parsePublishPlan(json: unknown): Release[][] {
	if (!isRecord(json)) throw new Error("Publish plan is not an object");
	if (json.version !== 1) throw new Error(`Unsupported publish plan version: ${String(json.version)}`);
	if (!Array.isArray(json.plan)) throw new Error("Publish plan has no plan array");
	return json.plan.map((chunk, index) => {
		if (!Array.isArray(chunk) || !chunk.every(isRelease)) {
			throw new Error(`Publish plan chunk ${index} is malformed`);
		}
		return chunk;
	});
}

/**
 * npm's `--json` output is not clean JSON: notices and warnings share stdout
 * with it. Walk back from the end to the last parseable object, the same way
 * Changesets reads `npm publish`.
 */
export function lastJsonObject(text: string): Record<string, unknown> | null {
	let candidate = text.replace(/[^}]*$/, "");
	while (candidate) {
		candidate = candidate.replace(/[^{]*/, "");
		try {
			const parsed: unknown = JSON.parse(candidate);
			return isRecord(parsed) ? parsed : null;
		} catch {
			candidate = candidate.slice(1);
		}
	}
	return null;
}

/**
 * Bun accepts `workspaces` as a bare array or as `{ packages, catalog }`; this
 * repository uses the object form for its version catalog.
 */
export function workspacePatterns(rootManifest: unknown): string[] {
	const field: unknown = isRecord(rootManifest) ? rootManifest.workspaces : undefined;
	const list: unknown = Array.isArray(field) ? field : isRecord(field) ? field.packages : undefined;
	return Array.isArray(list) ? list.filter((entry): entry is string => typeof entry === "string") : [];
}

/**
 * Package name → directory, from the root `workspaces` globs. Avoids pulling
 * `@manypkg/get-packages` into the root manifest for one lookup.
 */
export async function findPackageDirs(rootDir: string): Promise<Map<string, string>> {
	const patterns = workspacePatterns(JSON.parse(await readFile(join(rootDir, "package.json"), "utf8")));
	const dirs = new Map<string, string>();
	for (const pattern of patterns) {
		const glob = new Bun.Glob(`${pattern}/package.json`);
		for await (const match of glob.scan({ cwd: rootDir, onlyFiles: true })) {
			const manifest: unknown = JSON.parse(await readFile(join(rootDir, match), "utf8"));
			if (isRecord(manifest) && typeof manifest.name === "string") {
				dirs.set(manifest.name, resolve(rootDir, match, ".."));
			}
		}
	}
	return dirs;
}
