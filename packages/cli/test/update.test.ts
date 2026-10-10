import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { access, cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { x } from "tinyexec";
import { add } from "../src/commands/add";
import { diff } from "../src/commands/diff";
import { type UpdateClients, type UpdateOptions, type UpdateResult, update } from "../src/commands/update";
import { contentHash } from "../src/lock/hash";
import { lockPath, readLock } from "../src/lock/lock";
import type { Format } from "../src/project/formatter";
import { createRegistryClient } from "../src/registry/client";

/**
 * `update`, end to end, against two registries that stand in for two refs.
 *
 * A registry read from a directory has no refs — the path is the whole address
 * — so `v1` and `v2` are two directories built here, and the clients `update`
 * takes are what map a ref to one of them. Everything else is the real thing:
 * `add` writes the project and its lock from `v1`, and `update` reads `v2`.
 *
 * What changed between them is one of each kind: a file edited upstream, a file
 * added to an item, a file dropped from one, an item that did not move, and an
 * item that is new and pulled in as a dependency.
 */

const FIXTURES = join(import.meta.dirname, "fixtures");

const CARD_V1 = [
	'import { View } from "react-native";',
	'import { cn } from "../../lib/cn";',
	"",
	"export function Card({ className, children }: CardProps) {",
	"\tconst padding = 4;",
	"\tconst radius = 8;",
	"",
	"\tconst style = { padding, borderRadius: radius };",
	"",
	'\treturn <View className={cn("border", className)} style={style}>{children}</View>;',
	"}",
	"",
].join("\n");

/** Upstream fixed the padding. */
const CARD_V2 = CARD_V1.replace("const padding = 4;", "const padding = 6;");

const BADGE = 'export function Badge() {\n\treturn "badge";\n}\n';
const CN = 'export function cn(...parts: string[]) {\n\treturn parts.join(" ");\n}\n';

type FixtureItem = {
	name: string;
	type: "registry:ui" | "registry:lib";
	registryDependencies?: string[];
	/** `<namespace>/<target>` → the library's text for it. */
	files: Record<string, string>;
};

const V1: FixtureItem[] = [
	{
		name: "card",
		type: "registry:ui",
		registryDependencies: ["cn"],
		files: { "ui/card/card.tsx": CARD_V1, "ui/card/card.styles.ts": "export const styles = {};\n" },
	},
	{ name: "badge", type: "registry:ui", files: { "ui/badge/badge.tsx": BADGE } },
	{ name: "cn", type: "registry:lib", files: { "lib/cn.ts": CN } },
];

const V2: FixtureItem[] = [
	{
		name: "card",
		type: "registry:ui",
		registryDependencies: ["cn", "tag"],
		files: { "ui/card/card.tsx": CARD_V2, "ui/card/card.types.ts": "export type CardProps = object;\n" },
	},
	{ name: "badge", type: "registry:ui", files: { "ui/badge/badge.tsx": BADGE } },
	{ name: "cn", type: "registry:lib", files: { "lib/cn.ts": CN } },
	{ name: "tag", type: "registry:ui", files: { "ui/tag/tag.tsx": "export const Tag = null;\n" } },
];

const CARD = "src/components/ui/card/card.tsx";
const CARD_KEY = "ui/card/card.tsx";
/** What `add` leaves in the project: the library's relative import, rewritten to the project's alias. */
const local = (text: string) => text.replace("../../lib/cn", "@/lib/cn");

const temporary: string[] = [];
let registries: string;

async function temp(prefix: string): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), prefix));
	temporary.push(directory);
	return directory;
}

/** Writes a registry the way the builder would: an index, an item each, and the source beside them. */
async function buildRegistry(root: string, items: readonly FixtureItem[]): Promise<void> {
	const entries = items.map((item) => ({
		name: item.name,
		type: item.type,
		title: item.name,
		description: `The ${item.name}.`,
		registryDependencies: item.registryDependencies ?? [],
		files: Object.keys(item.files).map((key) => {
			const namespace = key.slice(0, key.indexOf("/"));
			const target = key.slice(key.indexOf("/") + 1);

			return {
				path: `source/${key}`,
				target,
				namespace,
				...(key === CARD_KEY ? { rewrites: [{ from: "../../lib/cn", to: "@registry/lib/cn" }] } : {}),
			};
		}),
	}));

	await put(
		join(root, "registry/registry.json"),
		JSON.stringify({
			name: "fixture",
			homepage: "https://example.test",
			items: entries.map((entry) => ({ ...entry, files: entry.files.map((f) => `${f.namespace}/${f.target}`) })),
		})
	);

	for (const entry of entries) await put(join(root, `registry/r/${entry.name}.json`), JSON.stringify(entry));

	for (const item of items) {
		for (const [key, content] of Object.entries(item.files)) await put(join(root, "source", key), content);
	}
}

async function put(path: string, content: string): Promise<void> {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, content, "utf-8");
}

const clientAt = (ref: string) => createRegistryClient({ cwd: registries, url: join(registries, ref, "registry") });

/** A project with `card` and `badge` copied in from `v1`, lock and all. */
async function project(): Promise<string> {
	const root = await temp("delacour-update-");
	await cp(join(FIXTURES, "expo-app"), root, { recursive: true });

	await put(
		join(root, "native-components.json"),
		JSON.stringify({
			paths: {
				ui: "src/components/ui",
				lib: "src/lib",
				hooks: "src/hooks",
				styles: "src/styles",
				icons: "src/lib/icons",
			},
			aliases: { ui: "@/components/ui", lib: "@/lib" },
		})
	);

	await add(["card", "badge"], {
		cwd: root,
		registry: join(registries, "v1", "registry"),
		ref: "v1",
		install: false,
		silent: true,
		yes: true,
	});

	return root;
}

function run(
	root: string,
	options: Partial<UpdateOptions> = {},
	clients: Partial<UpdateClients> = {},
	names: string[] = []
): Promise<UpdateResult> {
	return update(
		names,
		{ cwd: root, ref: "v2", install: false, silent: true, yes: true, format: false, ...options },
		{ target: clientAt("v2"), baseClient: clientAt, ...clients }
	);
}

const read = (root: string, path: string) => readFile(join(root, path), "utf-8");
const edit = async (root: string, path: string, change: (text: string) => string) =>
	writeFile(join(root, path), change(await read(root, path)), "utf-8");
const exists = (root: string, path: string) =>
	access(join(root, path)).then(
		() => true,
		() => false
	);
const action = (result: UpdateResult, path: string) => result.files.find((file) => file.path === path)?.action;

beforeAll(async () => {
	registries = await temp("delacour-registries-");
	await buildRegistry(join(registries, "v1"), V1);
	await buildRegistry(join(registries, "v2"), V2);
});

afterAll(async () => {
	await Promise.all(temporary.map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("update, in a project nobody has edited", () => {
	let root: string;
	let result: UpdateResult;

	beforeAll(async () => {
		root = await project();
		result = await run(root);
	});

	test("starts from the registry's v1 text, with the import rewritten for the project", async () => {
		expect(local(CARD_V1)).toContain('from "@/lib/cn"');
	});

	test("replaces a file the registry changed", async () => {
		expect(action(result, CARD)).toBe("updated");
		expect(await read(root, CARD)).toBe(local(CARD_V2));
	});

	test("writes a file the item gained, and an item it now depends on", async () => {
		expect(action(result, "src/components/ui/card/card.types.ts")).toBe("added");
		expect(action(result, "src/components/ui/tag/tag.tsx")).toBe("added");
		await expect(exists(root, "src/components/ui/tag/tag.tsx")).resolves.toBe(true);
	});

	test("says nothing needs doing for an item that did not move", () => {
		expect(action(result, "src/components/ui/badge/badge.tsx")).toBe("current");
		expect(action(result, "src/lib/cn.ts")).toBe("current");
	});

	test("leaves a file the item dropped where it is, and says so", async () => {
		const dropped = result.files.find((file) => file.path === "src/components/ui/card/card.styles.ts");

		expect(dropped).toMatchObject({ action: "skipped", note: expect.stringContaining("--prune") });
		await expect(exists(root, "src/components/ui/card/card.styles.ts")).resolves.toBe(true);
	});

	test("moves the lock to the new ref, naming the registry's new text", async () => {
		const lock = await readLock(root);

		expect(lock.items.card?.files[CARD_KEY]).toEqual({ ref: "v2", hash: contentHash(local(CARD_V2)) });
		expect(lock.items.badge?.files["ui/badge/badge.tsx"]?.ref).toBe("v2");
		expect(lock.items.tag).toBeDefined();
	});

	test("counts what it wrote, and no conflicts", () => {
		expect(result.written).toBe(3);
		expect(result.conflicts).toBe(0);
	});

	test("has nothing left to do on a second run", async () => {
		const again = await run(root);

		expect(again.written).toBe(0);
		expect(again.files.filter((file) => file.action !== "current" && file.action !== "skipped")).toEqual([]);
	});
});

describe("update --prune", () => {
	test("deletes an untouched file its item no longer has, and forgets it", async () => {
		const root = await project();
		const result = await run(root, { prune: true });

		expect(action(result, "src/components/ui/card/card.styles.ts")).toBe("deleted");
		await expect(exists(root, "src/components/ui/card/card.styles.ts")).resolves.toBe(false);
		expect((await readLock(root)).items.card?.files["ui/card/card.styles.ts"]).toBeUndefined();
	});

	test("keeps one the project edited", async () => {
		const root = await project();
		await edit(root, "src/components/ui/card/card.styles.ts", (text) => `${text}// mine\n`);

		const result = await run(root, { prune: true });

		expect(action(result, "src/components/ui/card/card.styles.ts")).toBe("skipped");
		await expect(exists(root, "src/components/ui/card/card.styles.ts")).resolves.toBe(true);
	});
});

describe("update, in a project that edited a file", () => {
	test("merges an edit the registry's change does not touch", async () => {
		const root = await project();
		await edit(root, CARD, (text) => text.replace('cn("border"', 'cn("border-2"'));

		const result = await run(root);
		const text = await read(root, CARD);

		expect(action(result, CARD)).toBe("merged");
		expect(text).toContain("const padding = 6;");
		expect(text).toContain('cn("border-2"');
		expect(result.conflicts).toBe(0);
	});

	test("writes conflict markers when both changed the same line, and reports it", async () => {
		const root = await project();
		await edit(root, CARD, (text) => text.replace("const padding = 4;", "const padding = 12;"));

		const result = await run(root);
		const text = await read(root, CARD);

		expect(action(result, CARD)).toBe("conflict");
		expect(result.conflicts).toBe(1);
		expect(text).toContain("<<<<<<< local\n\tconst padding = 12;\n=======\n\tconst padding = 6;\n>>>>>>> registry@v2");
	});

	// The base is now v2, so the unresolved file is the project's edit of it —
	// not something to merge the same change into a second time.
	test("does not merge again into a conflict it already wrote", async () => {
		const root = await project();
		await edit(root, CARD, (text) => text.replace("const padding = 4;", "const padding = 12;"));
		await run(root);

		const before = await read(root, CARD);
		const again = await run(root);

		expect(action(again, CARD)).toBe("kept");
		expect(await read(root, CARD)).toBe(before);
	});

	test("keeps an edit when the registry has nothing new for that file", async () => {
		const root = await project();
		await edit(root, "src/components/ui/badge/badge.tsx", (text) => text.replace('"badge"', '"mine"'));

		const result = await run(root);

		expect(action(result, "src/components/ui/badge/badge.tsx")).toBe("kept");
		expect(await read(root, "src/components/ui/badge/badge.tsx")).toContain('"mine"');
	});

	test("updates only what is named, and what that depends on", async () => {
		const root = await project();
		const result = await run(root, {}, {}, ["badge"]);

		expect(result.files.map((file) => file.item)).toEqual(["badge"]);
		expect(await read(root, CARD)).toBe(local(CARD_V1));
	});
});

describe("update, in a project that formats its files", () => {
	/** Stands in for the project's formatter: sets a file in two spaces. */
	const format: Format = async (content) => content.replaceAll("\t", "  ");

	test("sees a reformatted file as untouched, and writes the update in the project's style", async () => {
		const root = await project();
		await edit(root, CARD, (text) => text.replaceAll("\t", "  "));

		const result = await run(root, {}, { format });

		expect(action(result, CARD)).toBe("updated");
		expect(await read(root, CARD)).toBe(local(CARD_V2).replaceAll("\t", "  "));
	});

	test("merges an edit made on top of the reformatting", async () => {
		const root = await project();
		await edit(root, CARD, (text) => text.replaceAll("\t", "  ").replace('cn("border"', 'cn("border-2"'));

		const result = await run(root, {}, { format });

		expect(action(result, CARD)).toBe("merged");
		expect(await read(root, CARD)).toBe(local(CARD_V2).replaceAll("\t", "  ").replace('cn("border"', 'cn("border-2"'));
	});

	// The lock names the registry's text, not the formatted file, so the next
	// update still has a base it can fetch.
	test("records the registry's own text in the lock", async () => {
		const root = await project();
		await edit(root, CARD, (text) => text.replaceAll("\t", "  "));
		await run(root, {}, { format });

		expect((await readLock(root)).items.card?.files[CARD_KEY]?.hash).toBe(contentHash(local(CARD_V2)));
	});
});

describe("update --dry-run", () => {
	test("reports the same plan and writes nothing", async () => {
		const root = await project();
		const lock = await read(root, "native-components.lock.json");

		const result = await run(root, { dryRun: true });

		expect(result.dryRun).toBe(true);
		expect(action(result, CARD)).toBe("updated");
		expect(await read(root, CARD)).toBe(local(CARD_V1));
		expect(await read(root, "native-components.lock.json")).toBe(lock);
		await expect(exists(root, "src/components/ui/tag/tag.tsx")).resolves.toBe(false);
	});
});

describe("update, in a project with no lock", () => {
	async function unlocked(): Promise<string> {
		const root = await project();
		await rm(lockPath(root));
		return root;
	}

	test("records a file that already matches the registry", async () => {
		const root = await unlocked();
		const result = await run(root);

		expect(action(result, "src/components/ui/badge/badge.tsx")).toBe("adopted");
		expect((await readLock(root)).items.badge?.files["ui/badge/badge.tsx"]?.ref).toBe("v2");
	});

	test("does not overwrite a file that differs, having nothing to merge it from", async () => {
		const root = await unlocked();
		const result = await run(root);

		expect(result.files.find((file) => file.path === CARD)).toMatchObject({
			action: "skipped",
			note: expect.stringContaining("--base"),
		});
		expect(await read(root, CARD)).toBe(local(CARD_V1));
		expect((await readLock(root)).items.card?.files[CARD_KEY]).toBeUndefined();
	});

	test("merges it once told which ref it came from", async () => {
		const root = await unlocked();
		await edit(root, CARD, (text) => text.replace('cn("border"', 'cn("border-2"'));

		const result = await run(root, { base: "v1" });
		const text = await read(root, CARD);

		expect(action(result, CARD)).toBe("merged");
		expect(text).toContain("const padding = 6;");
		expect(text).toContain('cn("border-2"');
	});
});

describe("update, when the ref a file came from has moved", () => {
	// `v1` was a branch, and it now serves what `v2` does.
	test("refuses to merge from a base that is not the text it recorded", async () => {
		const root = await project();
		await edit(root, CARD, (text) => text.replace('cn("border"', 'cn("border-2"'));

		const result = await run(root, {}, { baseClient: () => clientAt("v2") });

		expect(result.files.find((file) => file.path === CARD)).toMatchObject({
			action: "skipped",
			note: expect.stringContaining("v1"),
		});
		expect(await read(root, CARD)).toContain("const padding = 4;");
	});

	test("still updates a file nobody edited — the hash is enough for that", async () => {
		const root = await project();
		const result = await run(root, {}, { baseClient: () => clientAt("v2") });

		expect(action(result, CARD)).toBe("updated");
	});
});

describe("update, with uncommitted changes in the way", () => {
	async function committed(): Promise<string> {
		const root = await project();
		const git = (...args: string[]) =>
			x("git", ["-c", "user.name=t", "-c", "user.email=t@example.test", ...args], {
				nodeOptions: { cwd: root },
				throwOnError: true,
			});

		await git("init", "-q");
		await git("add", "-A");
		await git("commit", "-q", "-m", "init");

		await edit(root, CARD, (text) => text.replace('cn("border"', 'cn("border-2"'));
		return root;
	}

	test("skips the merge when there is no one to ask", async () => {
		const root = await committed();
		const result = await run(root);

		expect(result.files.find((file) => file.path === CARD)).toMatchObject({
			action: "skipped",
			note: expect.stringContaining("--force"),
		});
		expect(await read(root, CARD)).toContain("const padding = 4;");
	});

	test("merges under --force", async () => {
		const root = await committed();
		const result = await run(root, { force: true });

		expect(action(result, CARD)).toBe("merged");
	});

	test("still replaces files nobody edited", async () => {
		const root = await committed();
		const result = await run(root);

		expect(action(result, "src/components/ui/card/card.types.ts")).toBe("added");
	});
});

describe("diff", () => {
	const clients = () => ({ target: clientAt("v2"), baseClient: clientAt });
	const options = (root: string) => ({ cwd: root, ref: "v2", silent: true, format: false });

	test("names the files an update would change, and writes nothing", async () => {
		const root = await project();
		const result = await diff(undefined, options(root), clients());

		expect(result.differing).toEqual(
			expect.arrayContaining([CARD, "src/components/ui/card/card.types.ts", "src/components/ui/tag/tag.tsx"])
		);
		expect(result.differing).not.toContain("src/components/ui/badge/badge.tsx");
		expect(await read(root, CARD)).toBe(local(CARD_V1));
	});

	// An edit with nothing new upstream is not a difference `update` can act on,
	// and it is not "everything matches" either.
	test("counts a file the project edited apart from the ones the registry moved", async () => {
		const root = await project();
		await edit(root, "src/components/ui/badge/badge.tsx", (text) => text.replace('"badge"', '"mine"'));

		const result = await diff("badge", options(root), clients());

		expect(result).toEqual({ differing: [], edited: ["src/components/ui/badge/badge.tsx"] });
	});
});
