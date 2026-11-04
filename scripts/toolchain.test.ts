import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The toolchain is pinned in many files, and `bun check` ties two of those pins together.
 *
 * `bun check` is the type checker every workspace's `typecheck` runs. It is TypeScript 7 compiled
 * into Bun, so the TypeScript version the gate checks with is Bun's, not the `typescript` package's.
 * The catalog's `typescript` is still what an editor and a bare `tsc` load. If the two drift, the
 * editor and the merge gate disagree about what an error is. A Bun that predates `bun check` (1.4.3
 * and earlier) does worse: the workspace's own `check` script, which is Biome, shadows the builtin,
 * and it fails on `--no-script` instead of type checking anything.
 */

const ROOT = join(import.meta.dirname, "..");

type PackageJson = {
	name: string;
	packageManager?: string;
	scripts?: Record<string, string>;
	workspaces?: { packages: string[]; catalog: Record<string, string> };
};

function readJson(path: string): PackageJson {
	return JSON.parse(readFileSync(join(ROOT, path), "utf8")) as PackageJson;
}

const root = readJson("package.json");

function workspacePackageJsons(): string[] {
	return ["apps", "packages"].flatMap((dir) =>
		readdirSync(join(ROOT, dir), { withFileTypes: true })
			.filter((entry) => entry.isDirectory())
			.map((entry) => `${dir}/${entry.name}/package.json`)
			.filter((path) => {
				try {
					readFileSync(join(ROOT, path));
					return true;
				} catch {
					return false;
				}
			})
	);
}

function pinnedBun(): string {
	const match = /^bun@(\d+\.\d+\.\d+)$/.exec(root.packageManager ?? "");
	if (!match?.[1]) throw new Error(`packageManager is not an exact bun@x.y.z: ${root.packageManager}`);
	return match[1];
}

/** Every Bun version written outside `packageManager`, with where it was found. */
function bunPins(): { file: string; version: string }[] {
	const sources: { file: string; pattern: RegExp }[] = [
		...readdirSync(join(ROOT, ".github/workflows")).map((name) => ({
			file: `.github/workflows/${name}`,
			pattern: /bun-version:\s*([\d.]+)/g,
		})),
		{ file: "apps/web/Dockerfile", pattern: /oven\/bun:([\d.]+)/g },
		{ file: "apps/playground/eas.json", pattern: /"bun":\s*"([\d.]+)"/g },
		...readdirSync(join(ROOT, "apps/playground/.eas/workflows")).map((name) => ({
			file: `apps/playground/.eas/workflows/${name}`,
			pattern: /^\s*bun:\s*([\d.]+)/gm,
		})),
	];

	return sources.flatMap(({ file, pattern }) =>
		[...readFileSync(join(ROOT, file), "utf8").matchAll(pattern)].map((match) => ({
			file,
			version: match[1] ?? "",
		}))
	);
}

describe("toolchain", () => {
	test("every Bun pin matches packageManager", () => {
		const expected = pinnedBun();
		const pins = bunPins();

		expect(pins.length).toBeGreaterThan(0);
		expect(pins.filter((pin) => pin.version !== expected)).toEqual([]);
	});

	test("the pinned Bun has bun check", () => {
		expect(Bun.semver.satisfies(pinnedBun(), ">=1.4.4")).toBe(true);
	});

	test("every workspace typecheck runs bun check, not tsc", () => {
		const offenders = workspacePackageJsons().flatMap((path) =>
			Object.entries(readJson(path).scripts ?? {})
				.filter(([name]) => name === "typecheck" || name.startsWith("typecheck:"))
				.filter(([, command]) => !command.startsWith("bun check --no-script"))
				.map(([name, command]) => `${path} ${name}: ${command}`)
		);

		expect(offenders).toEqual([]);
	});

	test("the TypeScript inside Bun satisfies the catalog's typescript", () => {
		const embedded = process.versions.typescript;
		const range = root.workspaces?.catalog.typescript;

		expect(embedded).toBeString();
		expect(range).toBeString();
		expect(Bun.semver.satisfies(embedded ?? "", range ?? "")).toBe(true);
	});
});
