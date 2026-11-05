import { describe, expect, test } from "bun:test";
import { Command, Option } from "commander";
import { DEFAULT_REGISTRY_URL } from "../registry/source";
import {
	classifyRegistry,
	componentsFor,
	errorKindOf,
	expoMajor,
	flagsSetOnCli,
	MAX_COMPONENTS,
	registryKindFor,
} from "./properties";

class RegistryFetchError extends Error {}

/** A command shaped like the real ones, parsed from `argv`, returning the action command. */
function parse(argv: string[]): Command {
	let seen: Command | undefined;
	const program = new Command().exitOverride();
	const command = program
		.command("add")
		.argument("[components...]")
		.option("-y, --yes")
		.option("--install")
		.option("--no-install")
		.option("--no-init")
		.addOption(new Option("--ref <ref>").default("main"))
		.option("--prefix <name>")
		.action((_components, _options, actionCommand: Command) => {
			seen = actionCommand;
		});
	command.parse(["add", ...argv], { from: "user" });
	if (!seen) throw new Error("action did not run");
	return seen;
}

describe("flagsSetOnCli", () => {
	test("lists the long names of flags typed on the command line, never values", () => {
		const flags = flagsSetOnCli(parse(["button", "--prefix", "SecretName", "-y"]));

		expect(flags).toEqual(["--prefix", "--yes"]);
		expect(JSON.stringify(flags)).not.toContain("SecretName");
	});

	test("leaves out defaults the user did not type", () => {
		expect(flagsSetOnCli(parse(["button"]))).toEqual([]);
	});

	test("tells --install from --no-install, which share one attribute", () => {
		expect(flagsSetOnCli(parse(["--install"]))).toEqual(["--install"]);
		expect(flagsSetOnCli(parse(["--no-install"]))).toEqual(["--no-install"]);
	});

	test("reports a lone --no- flag by its negated name", () => {
		expect(flagsSetOnCli(parse(["--no-init"]))).toEqual(["--no-init"]);
	});

	test("is sorted, so the same invocation always reads the same", () => {
		expect(flagsSetOnCli(parse(["--prefix", "X", "--no-init", "-y"]))).toEqual(["--no-init", "--prefix", "--yes"]);
	});
});

describe("classifyRegistry", () => {
	test("the default registry, at any ref, is official", () => {
		expect(classifyRegistry({ kind: "remote", base: `${DEFAULT_REGISTRY_URL}/main/registry`, root: "" })).toBe(
			"official"
		);
		expect(classifyRegistry({ kind: "remote", base: `${DEFAULT_REGISTRY_URL}/abc123/registry`, root: "" })).toBe(
			"official"
		);
	});

	test("a lookalike repository is custom", () => {
		expect(
			classifyRegistry({
				kind: "remote",
				base: "https://raw.githubusercontent.com/delacournz/delacour-ui-fork/main/registry",
				root: "",
			})
		).toBe("custom");
	});

	test("a filesystem registry is local", () => {
		expect(classifyRegistry({ kind: "local", base: "/x/registry", root: "/x" })).toBe("local");
	});
});

describe("registryKindFor", () => {
	const cwd = "/tmp/project";

	test("nothing configured is official", () => {
		expect(registryKindFor({ cwd, env: {} })).toBe("official");
	});

	test("--registry decides, a path is local and a URL is custom", () => {
		expect(registryKindFor({ cwd, registry: "./registry", env: {} })).toBe("local");
		expect(registryKindFor({ cwd, registry: "https://example.com/registry", env: {} })).toBe("custom");
		expect(registryKindFor({ cwd, registry: "github:acme/ui", env: {} })).toBe("custom");
	});

	test("DELACOUR_REGISTRY applies when no flag is given, as cli:link sets it", () => {
		expect(registryKindFor({ cwd, env: { DELACOUR_REGISTRY: "/tree/registry" } })).toBe("local");
	});

	test("a registry in the project's config counts when no flag is given", () => {
		expect(registryKindFor({ cwd, configRegistry: "github:acme/ui", env: {} })).toBe("custom");
		expect(registryKindFor({ cwd, registry: DEFAULT_REGISTRY_URL, configRegistry: "github:acme/ui", env: {} })).toBe(
			"official"
		);
	});
});

describe("componentsFor", () => {
	test("keeps component names for the commands that take them, from the official registry", () => {
		for (const command of ["add", "update", "view", "diff", "init"]) {
			expect(componentsFor(command, ["button", "text-field"], "official")).toEqual(["button", "text-field"]);
		}
	});

	test("sends nothing for a custom or local registry, whose names could be private", () => {
		expect(componentsFor("add", ["button"], "custom")).toBeNull();
		expect(componentsFor("add", ["button"], "local")).toBeNull();
	});

	test("sends nothing for commands whose arguments are not component names", () => {
		expect(componentsFor("search", ["button"], "official")).toBeNull();
		expect(componentsFor("skills", ["button"], "official")).toBeNull();
		expect(componentsFor("theme", ["button"], "official")).toBeNull();
	});

	test("drops anything that is not shaped like a registry name", () => {
		expect(
			componentsFor(
				"add",
				["button", "../etc/passwd", "Button", "a".repeat(41), "https://x.y", "", "two words"],
				"official"
			)
		).toEqual(["button"]);
	});

	test("caps the list", () => {
		const many = Array.from({ length: 80 }, (_, index) => `item-${index}`);

		expect(componentsFor("add", many, "official")).toHaveLength(MAX_COMPONENTS);
	});

	test("an empty list is null, so the property is left out", () => {
		expect(componentsFor("add", [], "official")).toBeNull();
		expect(componentsFor("add", ["NOPE"], "official")).toBeNull();
	});
});

describe("expoMajor", () => {
	test("reads the major off a range", () => {
		expect(expoMajor("~54.0.1")).toBe(54);
		expect(expoMajor("^55.0.0-canary-123")).toBe(55);
		expect(expoMajor("58.0.0")).toBe(58);
	});

	test("is null for anything else", () => {
		expect(expoMajor(null)).toBeNull();
		expect(expoMajor("latest")).toBeNull();
		expect(expoMajor("workspace:*")).toBeNull();
	});
});

describe("errorKindOf", () => {
	test("is the class name and never the message", () => {
		const error = new RegistryFetchError("GET https://private.example/secret failed");

		expect(errorKindOf(error)).toBe("RegistryFetchError");
	});

	test("a plain Error is Error", () => {
		expect(errorKindOf(new Error("boom"))).toBe("Error");
	});

	test("anything thrown that is not an Error is unknown", () => {
		expect(errorKindOf("a string with /Users/me/secret")).toBe("unknown");
		expect(errorKindOf(undefined)).toBe("unknown");
	});

	test("a class name that is not a plain identifier is Error", () => {
		class Odd extends Error {}
		Object.defineProperty(Odd, "name", { value: "has spaces /path" });

		expect(errorKindOf(new Odd("x"))).toBe("Error");
	});
});
