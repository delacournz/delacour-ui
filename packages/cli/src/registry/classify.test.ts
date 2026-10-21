import { describe, expect, test } from "bun:test";
import { classifySource, resolveModuleId } from "./classify";

describe("classifySource", () => {
	test("a component folder becomes one ui item named for the folder", () => {
		expect(classifySource("components/button/button.tsx")).toEqual({
			item: "button",
			type: "registry:ui",
			namespace: "ui",
			target: "button/button.tsx",
			moduleId: "button/button.tsx".replace(/\.tsx$/, ""),
			test: false,
		});
	});

	test("a component's index collapses to the folder name", () => {
		const result = classifySource("components/button/index.ts");
		expect(result?.moduleId).toBe("button");
		expect(result?.target).toBe("button/index.ts");
	});

	test("every file in a component folder belongs to that folder's item", () => {
		expect(classifySource("components/list-group/list-group.variants.ts")?.item).toBe("list-group");
		expect(classifySource("components/list-group/list-group-item-title.tsx")?.item).toBe("list-group");
	});

	test("each lib file is its own item, flat in the lib namespace", () => {
		expect(classifySource("lib/cn.ts")).toEqual({
			item: "cn",
			type: "registry:lib",
			namespace: "lib",
			target: "cn.ts",
			moduleId: "cn",
			test: false,
		});
		expect(classifySource("lib/slot.tsx")?.item).toBe("slot");
	});

	test("each hook is its own item", () => {
		expect(classifySource("hooks/use-theme-color.ts")).toEqual({
			item: "use-theme-color",
			type: "registry:hook",
			namespace: "hooks",
			target: "use-theme-color.ts",
			moduleId: "use-theme-color",
			test: false,
		});
	});

	test("the whole styles directory is one item, CSS included", () => {
		expect(classifySource("styles/tokens.ts")?.item).toBe("styles");
		expect(classifySource("styles/theme.css")).toEqual({
			item: "styles",
			type: "registry:style",
			namespace: "styles",
			target: "theme.css",
			moduleId: null,
			test: false,
		});
	});

	test("the uniwind type reference rides along with the styles item", () => {
		expect(classifySource("uniwind-env.d.ts")?.item).toBe("styles");
		expect(classifySource("uniwind-env.d.ts")?.namespace).toBe("styles");
	});

	test("the Central Icons re-export is its own item in its own namespace", () => {
		expect(classifySource("icons/central.ts")).toEqual({
			item: "icons",
			type: "registry:lib",
			namespace: "icons",
			target: "central.ts",
			moduleId: "central",
			test: false,
		});
	});

	test("the expo integration is one item, kept in its own folder under lib", () => {
		expect(classifySource("expo/navigation-theme.tsx")).toEqual({
			item: "expo",
			type: "registry:lib",
			namespace: "lib",
			target: "expo/navigation-theme.tsx",
			moduleId: "expo/navigation-theme",
			test: false,
		});
	});

	// An engine for an optional native peer rides along with nothing: an app adding the navigation
	// theme must not be handed `expo-blur`, and one adding the blur engine must not be handed
	// `expo-router`. It still lands under `lib/expo/`, beside the theme.
	test("the blur engine is an expo file with an item of its own", () => {
		expect(classifySource("expo/blur-layer.tsx")).toEqual({
			item: "blur-layer",
			type: "registry:lib",
			namespace: "lib",
			target: "expo/blur-layer.tsx",
			moduleId: "expo/blur-layer",
			test: false,
		});
	});

	test("a component's test belongs to its folder's item, marked as a test", () => {
		expect(classifySource("components/button/button.variants.test.ts")).toEqual({
			item: "button",
			type: "registry:ui",
			namespace: "ui",
			target: "button/button.variants.test.ts",
			moduleId: "button/button.variants.test",
			test: true,
		});
	});

	test("test-only support files are tests of the item they serve", () => {
		expect(classifySource("components/qr-code/qr-code.test-helpers.ts")).toMatchObject({ item: "qr-code", test: true });
		expect(classifySource("components/qr-code/qr-code.fixtures.ts")).toMatchObject({ item: "qr-code", test: true });
		expect(classifySource("components/qr-code/qr-code.encode.ts")).toMatchObject({ item: "qr-code", test: false });
	});

	test("a lib test belongs to the file it is named for, not an item of its own", () => {
		expect(classifySource("lib/cn.test.ts")).toEqual({
			item: "cn",
			type: "registry:lib",
			namespace: "lib",
			target: "cn.test.ts",
			moduleId: "cn.test",
			test: true,
		});
		expect(classifySource("lib/scroll-maths.test.ts")?.item).toBe("scroll-maths");
	});

	test("a styles test rides with the styles item", () => {
		expect(classifySource("styles/theme-tokens.test.ts")).toMatchObject({
			item: "styles",
			target: "theme-tokens.test.ts",
			moduleId: "theme-tokens.test",
			test: true,
		});
	});

	test("a library-wide test at the root belongs to no item", () => {
		expect(classifySource("docs.test.ts")).toBeNull();
	});

	test("anything outside the known directories is excluded rather than guessed at", () => {
		expect(classifySource("scratch.ts")).toBeNull();
		expect(classifySource("components/button")).toBeNull();
	});
});

describe("resolveModuleId", () => {
	const files = [
		"components/button/index.ts",
		"components/button/button.tsx",
		"components/icon/icon.variants.ts",
		"lib/cn.ts",
		"styles/tokens.ts",
	];

	test("resolves a relative import against the importing file", () => {
		expect(resolveModuleId("components/button/button.tsx", "../icon/icon.variants", files)).toBe(
			"components/icon/icon.variants.ts"
		);
		expect(resolveModuleId("components/button/button.tsx", "../../lib/cn", files)).toBe("lib/cn.ts");
	});

	test("prefers a folder's index when the specifier names the folder", () => {
		expect(resolveModuleId("components/spinner/spinner.tsx", "../button", files)).toBe("components/button/index.ts");
	});

	test("returns null for a specifier that resolves to nothing", () => {
		expect(resolveModuleId("lib/cn.ts", "./missing", files)).toBeNull();
	});
});
