import { describe, expect, test } from "bun:test";
import { registryFileSchema, registryItemSchema, toIndexEntry, withTests } from "./schema";

const FILE = {
	path: "packages/react-native-ui/src/components/button/button.tsx",
	target: "button/button.tsx",
	namespace: "ui",
} as const;

describe("registryFileSchema", () => {
	test("accepts a file that references its source, and defaults its rewrites", () => {
		expect(registryFileSchema.parse(FILE)).toEqual({
			path: FILE.path,
			target: FILE.target,
			namespace: "ui",
			rewrites: [],
		});
	});

	test("carries the specifier rewrites the file needs", () => {
		const rewrites = [{ from: "../icon", to: "@registry/ui/icon" }];

		expect(registryFileSchema.parse({ ...FILE, rewrites }).rewrites).toEqual(rewrites);
	});

	// The one field that changes a fetched file's text, so the one a hostile
	// registry would reach for. A placeholder resolves to a path inside the copy;
	// anything else would be arbitrary source spliced into someone's project.
	test("rejects a rewrite that does not target a placeholder", () => {
		const result = registryFileSchema.safeParse({
			...FILE,
			rewrites: [{ from: "../icon", to: "https://evil.example/x" }],
		});

		expect(result.success).toBe(false);
	});

	test("rejects inline content, and says why", () => {
		const result = registryFileSchema.safeParse({ ...FILE, content: "export const Button = () => null;" });

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe(
			"inline `content` is not supported; reference the file with `path` instead"
		);
	});

	test("ignores a field it does not know, so a newer registry still parses", () => {
		const parsed = registryFileSchema.parse({ ...FILE, futureField: 1 });

		expect(parsed).not.toHaveProperty("futureField");
		expect(parsed.target).toBe(FILE.target);
	});

	// `join()` treats `\` as a separator on Windows, so a POSIX-only check lets
	// these land outside the namespace they were resolved against.
	for (const traversal of ["../../evil.ts", "..\\..\\evil.ts", "/etc/passwd", "\\etc\\passwd", "C:\\evil.ts"]) {
		test(`rejects ${traversal} as a target`, () => {
			expect(registryFileSchema.safeParse({ ...FILE, target: traversal }).success).toBe(false);
		});

		test(`rejects ${traversal} as a path`, () => {
			expect(registryFileSchema.safeParse({ ...FILE, path: traversal }).success).toBe(false);
		});
	}

	test("keeps a dotted segment that is not a traversal", () => {
		expect(registryFileSchema.safeParse({ ...FILE, target: "button/..button.tsx" }).success).toBe(true);
	});
});

describe("registryItemSchema", () => {
	const ITEM = {
		name: "button",
		type: "registry:ui",
		title: "Button",
		description: "A pressable action.",
		files: [FILE],
	} as const;

	test("fills the three dependency lists", () => {
		const item = registryItemSchema.parse(ITEM);

		expect(item.registryDependencies).toEqual([]);
		expect(item.dependencies).toEqual([]);
		expect(item.expoDependencies).toEqual([]);
		expect(item.devDependencies).toEqual([]);
	});

	test("fails the whole item when one file inlines content", () => {
		const result = registryItemSchema.safeParse({ ...ITEM, files: [FILE, { ...FILE, content: "x" }] });

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.path).toEqual(["files", 1, "content"]);
	});

	test("defaults the test lists, so a registry built before them still parses", () => {
		const item = registryItemSchema.parse(ITEM);

		expect(item.tests).toEqual([]);
		expect(item.testRegistryDependencies).toEqual([]);
		expect(item.testDependencies).toEqual([]);
	});
});

describe("withTests", () => {
	const TEST_FILE = {
		path: "packages/react-native-ui/src/components/button/button.variants.test.ts",
		target: "button/button.variants.test.ts",
		namespace: "ui",
	} as const;

	const item = registryItemSchema.parse({
		name: "button",
		type: "registry:ui",
		title: "Button",
		description: "A pressable action.",
		registryDependencies: ["icon"],
		devDependencies: ["a"],
		files: [FILE],
		tests: [TEST_FILE],
		testRegistryDependencies: ["text"],
		testDependencies: ["@types/bun"],
	});

	test("folds the tests into the files, after the source", () => {
		expect(withTests(item).files.map((file) => file.target)).toEqual(["button/button.tsx", TEST_FILE.target]);
	});

	test("folds what the tests need into what the item needs", () => {
		expect(withTests(item).registryDependencies).toEqual(["icon", "text"]);
		expect(withTests(item).devDependencies).toEqual(["@types/bun", "a"]);
	});

	test("asks for the runner the project tests with in place of Bun's types", () => {
		expect(withTests(item, "vitest").devDependencies).toEqual(["@types/node", "a", "vitest"]);
		expect(withTests(item, "jest").devDependencies).toEqual(["@jest/globals", "@types/node", "a"]);
	});

	test("leaves the item alone otherwise", () => {
		expect(item.files).toHaveLength(1);
		expect(item.registryDependencies).toEqual(["icon"]);
	});
});

describe("toIndexEntry", () => {
	test("lists the source files and not the tests, which are only on the item", () => {
		const entry = toIndexEntry(
			registryItemSchema.parse({
				name: "button",
				type: "registry:ui",
				title: "Button",
				description: "A pressable action.",
				files: [FILE],
				tests: [{ ...FILE, target: "button/button.test.ts" }],
				testRegistryDependencies: ["text"],
			})
		);

		expect(entry.files).toEqual(["ui/button/button.tsx"]);
		expect(entry.testRegistryDependencies).toEqual(["text"]);
		expect("tests" in entry).toBe(false);
	});
});
