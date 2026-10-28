import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The stable line is one `v*` tag per release, and `release.yml` refuses a tag that any published
 * package's version disagrees with. That only holds while the published packages are a single
 * `fixed` group: then a changeset naming any of them moves all four, the CLI included, changed or not.
 */
const root = join(import.meta.dir, "..");

/** Every package that reaches npm, keyed by the folder `release.yml` packs it from. */
const PUBLISHED = {
	"packages/cli": "delacour",
	"packages/react-native-ui": "@delacour/react-native-ui",
	"packages/react-native-charts": "@delacour/react-native-charts",
	"packages/react-native-bottom-sheet": "@delacour/react-native-bottom-sheet",
} as const;

type ChangesetConfig = { baseBranch: string; commit: boolean; fixed: string[][]; linked: string[][] };
type Manifest = { name: string; version: string; private?: boolean };

function readJson<T>(path: string): T {
	return JSON.parse(readFileSync(join(root, path), "utf8")) as T;
}

const config = readJson<ChangesetConfig>(".changeset/config.json");

describe(".changeset/config.json", () => {
	test("versions are cut for develop and never committed by the CLI", () => {
		expect(config.baseBranch).toBe("develop");
		expect(config.commit).toBe(false);
	});

	test("the one fixed group is exactly the published packages", () => {
		expect(config.fixed).toHaveLength(1);
		expect([...(config.fixed[0] ?? [])].sort()).toEqual(Object.values(PUBLISHED).sort());
		expect(config.linked).toEqual([]);
	});

	test("each published folder holds the package it is named for, and none is private", () => {
		for (const [dir, name] of Object.entries(PUBLISHED)) {
			const manifest = readJson<Manifest>(join(dir, "package.json"));
			expect(manifest.name).toBe(name);
			expect(manifest.private).not.toBe(true);
		}
	});

	test("release.yml packs and checks every published folder", async () => {
		const text = await Bun.file(join(root, ".github", "workflows", "release.yml")).text();
		for (const dir of Object.keys(PUBLISHED)) expect(text).toContain(dir);
	});
});
