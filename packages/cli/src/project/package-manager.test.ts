import { describe, expect, test } from "bun:test";
import { commandLine, type InstallGroup, installCommands, missingPackages, planDependencies } from "./package-manager";

const NONE = { dependencies: [], devDependencies: [], expoDependencies: [] };

describe("installCommands", () => {
	test("routes native modules through expo install so the SDK picks the version", () => {
		const groups = installCommands({
			...NONE,
			packageManager: "bun",
			expoDependencies: ["react-native-reanimated", "react-native-svg"],
		});

		expect(groups).toHaveLength(1);
		expect(groups[0]?.command).toBe("bunx");
		expect(groups[0]?.args).toEqual(["expo", "install", "react-native-reanimated", "react-native-svg"]);
	});

	test("uses each package manager's own way of running the local expo CLI", () => {
		const forManager = (packageManager: "bun" | "pnpm" | "yarn" | "npm") =>
			installCommands({ ...NONE, packageManager, expoDependencies: ["react-native-svg"] })[0];

		expect(forManager("npm")?.command).toBe("npx");
		expect(forManager("pnpm")?.command).toBe("pnpm");
		expect(forManager("yarn")?.command).toBe("yarn");
	});

	test("installs plain packages with the project's package manager", () => {
		const groups = installCommands({ ...NONE, packageManager: "npm", dependencies: ["clsx"] });

		expect(groups[0]?.command).toBe("npm");
		expect(groups[0]?.args).toEqual(["install", "clsx"]);
	});

	test("passes the right dev flag per package manager", () => {
		const forManager = (packageManager: "bun" | "pnpm" | "yarn" | "npm") =>
			installCommands({ ...NONE, packageManager, devDependencies: ["typescript"] })[0]?.args;

		expect(forManager("bun")).toEqual(["add", "--dev", "typescript"]);
		expect(forManager("npm")).toEqual(["install", "--save-dev", "typescript"]);
		expect(forManager("pnpm")).toEqual(["add", "--save-dev", "typescript"]);
	});

	test("emits one group per route, expo first", () => {
		const groups = installCommands({
			packageManager: "bun",
			expoDependencies: ["uniwind"],
			dependencies: ["clsx"],
			devDependencies: ["typescript"],
		});

		expect(groups.map((group) => group.label)).toEqual(["expo install", "bun add", "bun add --dev"]);
	});

	test("emits nothing when there is nothing to install", () => {
		expect(installCommands({ ...NONE, packageManager: "bun" })).toEqual([]);
	});
});

describe("missingPackages", () => {
	const packageJson = { dependencies: { clsx: "^2.0.0" }, devDependencies: { typescript: "^5.0.0" } };

	test("skips what the project already has, in either list", () => {
		expect(missingPackages(packageJson, ["clsx", "typescript", "tailwind-merge"])).toEqual(["tailwind-merge"]);
	});

	test("treats a project with no package.json as having nothing", () => {
		expect(missingPackages(null, ["clsx"])).toEqual(["clsx"]);
	});
});

describe("planDependencies", () => {
	const packageJson = {
		dependencies: { "react-native-reanimated": "~4.5.1" },
		devDependencies: { typescript: "^5.0.0" },
	};

	test("commands cover only what is missing, and the rest is reported as satisfied", () => {
		const plan = planDependencies(
			{
				packageManager: "bun",
				expoDependencies: ["react-native-reanimated", "@gorhom/bottom-sheet"],
				dependencies: ["tailwind-variants"],
				devDependencies: ["typescript"],
			},
			packageJson
		);

		expect(plan.groups.map((group) => group.packages)).toEqual([["@gorhom/bottom-sheet"], ["tailwind-variants"]]);
		expect(plan.satisfied).toEqual(["react-native-reanimated", "typescript"]);
		expect(plan.missing).toEqual(["@gorhom/bottom-sheet", "tailwind-variants"]);
	});

	test("a package wanted by two routes is reported once", () => {
		const plan = planDependencies(
			{ packageManager: "bun", expoDependencies: ["uniwind"], dependencies: ["uniwind"], devDependencies: [] },
			null
		);

		expect(plan.wanted).toEqual(["uniwind"]);
	});

	test("nothing missing means no commands and nothing to run", () => {
		const plan = planDependencies(
			{ packageManager: "bun", expoDependencies: ["react-native-reanimated"], dependencies: [], devDependencies: [] },
			packageJson
		);

		expect(plan.groups).toEqual([]);
		expect(plan.missing).toEqual([]);
		expect(plan.satisfied).toEqual(["react-native-reanimated"]);
	});
});

describe("commandLine", () => {
	test("renders a group as the line a user could paste", () => {
		const [group] = installCommands({ ...NONE, packageManager: "pnpm", expoDependencies: ["react-native-svg"] });

		expect(commandLine(group as InstallGroup)).toBe("pnpm expo install react-native-svg");
	});
});

describe("pre-mode dist tags", () => {
	test("installs @delacour/charts from the alpha tag", () => {
		// `latest` deliberately points at nothing while this repository is in
		// Changesets pre mode, so an untagged add fails outright.
		const [group] = installCommands({ ...NONE, packageManager: "bun", dependencies: ["@delacour/charts"] });

		expect(commandLine(group as InstallGroup)).toBe("bun add @delacour/charts@alpha");
	});

	test("leaves every other package untagged", () => {
		const [group] = installCommands({ ...NONE, packageManager: "bun", dependencies: ["clsx", "@delacour/charts"] });

		expect(commandLine(group as InstallGroup)).toBe("bun add clsx @delacour/charts@alpha");
	});

	test("tags the args but not the packages, so the satisfied check still matches", () => {
		// `missingPackages` compares bare names against the project's own
		// package.json. A tagged spec there would never match and the CLI would
		// offer to reinstall a package the project already has, on every run.
		const plan = planDependencies(
			{ packageManager: "bun", expoDependencies: [], dependencies: ["@delacour/charts"], devDependencies: [] },
			{ dependencies: { "@delacour/charts": "^0.1.0" } }
		);

		expect(plan.satisfied).toEqual(["@delacour/charts"]);
		expect(plan.missing).toEqual([]);
	});
});
