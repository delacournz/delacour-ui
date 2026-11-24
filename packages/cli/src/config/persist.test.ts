import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { persistTestsEnabled } from "./persist";
import { configSchema } from "./schema";

let dir: string;
let path: string;

beforeEach(async () => {
	dir = await mkdtemp(join(tmpdir(), "persist-"));
	path = join(dir, "native-components.json");
});
afterEach(() => rm(dir, { recursive: true, force: true }));

describe("persistTestsEnabled", () => {
	test("adds tests.enabled and keeps every other key", async () => {
		await writeFile(path, JSON.stringify({ framework: "expo", tests: { runner: "jest" } }, null, "\t"));

		expect(await persistTestsEnabled(path, true)).toBe(true);

		const saved = JSON.parse(await readFile(path, "utf-8"));
		expect(saved).toEqual({ framework: "expo", tests: { runner: "jest", enabled: true } });
		expect(configSchema.shape.tests.parse(saved.tests)).toEqual({ runner: "jest", enabled: true });
	});

	test("creates the tests block when there is none", async () => {
		await writeFile(path, "{}\n");
		await persistTestsEnabled(path, false);
		expect(JSON.parse(await readFile(path, "utf-8"))).toEqual({ tests: { enabled: false } });
	});

	test("writes nothing when the answer is already saved", async () => {
		await writeFile(path, '{"tests":{"enabled":true}}');
		expect(await persistTestsEnabled(path, true)).toBe(false);
		expect(await readFile(path, "utf-8")).toBe('{"tests":{"enabled":true}}');
	});
});
