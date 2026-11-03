import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { itemsAddedFor, standaloneItems } from "./checks";

describe("standaloneItems", () => {
	let dir: string;

	beforeEach(async () => {
		dir = await mkdtemp(join(tmpdir(), "standalone-"));
	});
	afterEach(() => rm(dir, { recursive: true, force: true }));

	const item = (name: string, type: string, extra: Record<string, unknown> = {}) => ({
		name,
		type,
		title: name,
		description: name,
		files: [],
		...extra,
	});

	async function write(items: unknown[]): Promise<void> {
		await writeFile(join(dir, "registry.json"), JSON.stringify({ name: "delacour", homepage: "https://x", items }));
	}

	test("names what neither a component nor its dependencies reach", async () => {
		await write([
			item("button", "registry:ui", { registryDependencies: ["cn"] }),
			item("cn", "registry:lib"),
			item("expo-theme", "registry:lib"),
		]);
		expect(await standaloneItems(dir, dir)).toEqual(["expo-theme"]);
	});

	test("an item only the tests depend on is not standalone — --tests brings it, a plain run must not", async () => {
		await write([
			item("button", "registry:ui", {
				renderTestRegistryDependencies: ["test-kit"],
				testRegistryDependencies: ["fixtures"],
			}),
			item("test-kit", "registry:lib"),
			item("fixtures", "registry:lib"),
		]);
		expect(await standaloneItems(dir, dir)).toEqual([]);
	});
});

describe("itemsAddedFor", () => {
	const items = [
		{
			name: "button",
			type: "registry:ui",
			registryDependencies: ["cn"],
			testRegistryDependencies: ["fixtures"],
			renderTestRegistryDependencies: ["test-kit"],
		},
		{ name: "cn", type: "registry:lib", registryDependencies: [] },
		{ name: "fixtures", type: "registry:lib", registryDependencies: [] },
		{ name: "test-kit", type: "registry:lib", registryDependencies: ["provider"] },
		{ name: "provider", type: "registry:ui", registryDependencies: [] },
		{ name: "expo-theme", type: "registry:lib", registryDependencies: [] },
	];

	test("a plain run adds components, their closure and the standalone items, and no test-only item", () => {
		expect([...itemsAddedFor(items, null)].sort()).toEqual(["button", "cn", "expo-theme", "provider"]);
	});

	test("--tests on bun or vitest adds the logic suites' items but not the render-test kit", () => {
		expect(itemsAddedFor(items, "bun").has("fixtures")).toBe(true);
		expect(itemsAddedFor(items, "vitest").has("test-kit")).toBe(false);
	});

	test("--tests on jest adds the render-test kit too", () => {
		expect(itemsAddedFor(items, "jest").has("test-kit")).toBe(true);
	});
});
