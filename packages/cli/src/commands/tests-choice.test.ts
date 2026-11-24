import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readConfig } from "../config/resolve";
import { chooseTests } from "./tests-choice";

let dir: string;
let path: string;

const write = (tests?: object) =>
	writeFile(
		path,
		JSON.stringify({
			paths: { ui: "ui", lib: "lib", hooks: "hooks", styles: "styles", icons: "icons" },
			...(tests ? { tests } : {}),
		})
	);

beforeEach(async () => {
	dir = await mkdtemp(join(tmpdir(), "tests-choice-"));
	path = join(dir, "native-components.json");
});
afterEach(() => rm(dir, { recursive: true, force: true }));

describe("chooseTests", () => {
	test("a project that never answered gets no tests", async () => {
		await write();
		expect(await chooseTests(await readConfig(path), undefined)).toBe(false);
	});

	test("the saved answer stands when no flag is passed", async () => {
		await write({ enabled: true });
		const config = await readConfig(path);
		expect(config.testsEnabled).toBe(true);
		expect(await chooseTests(config, undefined)).toBe(true);
	});

	test("a flag wins and is saved", async () => {
		await write({ enabled: true });
		expect(await chooseTests(await readConfig(path), false)).toBe(false);
		expect(JSON.parse(await readFile(path, "utf-8")).tests.enabled).toBe(false);
		expect((await readConfig(path)).testsEnabled).toBe(false);
	});

	test("a dry run saves nothing", async () => {
		await write();
		expect(await chooseTests(await readConfig(path), true, false)).toBe(true);
		expect(JSON.parse(await readFile(path, "utf-8")).tests).toBeUndefined();
	});
});
