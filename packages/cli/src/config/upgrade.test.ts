import { describe, expect, test } from "bun:test";
import { CONFIG_VERSION } from "./schema";
import { applyUpgrade, configVersion, upgradeStatus } from "./upgrade";

const PATHS = {
	ui: "src/components/ui",
	lib: "src/lib",
	hooks: "src/hooks",
	styles: "src/styles",
	icons: "src/lib/icons",
};

describe("configVersion", () => {
	test("reads a config with no version as the first one", () => {
		expect(configVersion({ paths: PATHS })).toBe(1);
	});

	test("reads the version a config records", () => {
		expect(configVersion({ version: 2, paths: PATHS })).toBe(2);
	});
});

describe("upgradeStatus", () => {
	test("is current at the version this CLI writes", () => {
		expect(upgradeStatus({ version: CONFIG_VERSION, paths: PATHS }, { hasCopiedFiles: false })).toEqual({
			kind: "current",
		});
	});

	test("is newer when a later CLI wrote it", () => {
		expect(upgradeStatus({ version: CONFIG_VERSION + 1, paths: PATHS }, { hasCopiedFiles: false })).toEqual({
			kind: "newer",
			version: CONFIG_VERSION + 1,
		});
	});

	test("asks for every field an unversioned config is missing", () => {
		const status = upgradeStatus({ paths: PATHS }, { hasCopiedFiles: false });

		expect(status.kind).toBe("outdated");
		if (status.kind !== "outdated") return;
		expect(status.from).toBe(1);
		expect(status.questions.map((question) => question.key)).toEqual(["tests.enabled", "prefix"]);
	});

	test("does not ask for a field the config already has", () => {
		const status = upgradeStatus({ paths: PATHS, tests: { enabled: true }, prefix: "UI" }, { hasCopiedFiles: false });

		expect(status).toEqual({ kind: "outdated", from: 1, questions: [] });
	});

	test("does not ask about tests when a flag already answered", () => {
		const status = upgradeStatus({ paths: PATHS }, { hasCopiedFiles: false, testsFlag: true });

		expect(status.kind === "outdated" && status.questions.map((question) => question.key)).toEqual(["prefix"]);
	});

	test("offers a prefix once components are copied too, saying it renames them", () => {
		const status = upgradeStatus({ paths: PATHS }, { hasCopiedFiles: true });
		const prefix =
			status.kind === "outdated" ? status.questions.find((question) => question.key === "prefix") : undefined;

		expect(prefix?.message).toContain("renames");
	});
});

describe("applyUpgrade", () => {
	test("records the answers and the current version, keeping every other key", () => {
		const raw = { $schema: "x", paths: PATHS, aliases: { ui: "@/components/ui" } };

		expect(applyUpgrade(raw, { "tests.enabled": true, prefix: "UI" })).toEqual({
			$schema: "x",
			version: CONFIG_VERSION,
			paths: PATHS,
			aliases: { ui: "@/components/ui" },
			tests: { enabled: true },
			prefix: "UI",
		});
	});

	test("puts the version straight after $schema, where a reader looks for it", () => {
		const upgraded = applyUpgrade({ $schema: "x", paths: PATHS }, {});

		expect(Object.keys(upgraded).slice(0, 2)).toEqual(["$schema", "version"]);
	});

	test("keeps a tests runner beside the new answer", () => {
		expect(applyUpgrade({ paths: PATHS, tests: { runner: "jest" } }, { "tests.enabled": false }).tests).toEqual({
			runner: "jest",
			enabled: false,
		});
	});

	test("writes nothing for a question left unanswered", () => {
		const upgraded = applyUpgrade({ paths: PATHS }, {});

		expect(upgraded).toEqual({ version: CONFIG_VERSION, paths: PATHS });
	});
});
