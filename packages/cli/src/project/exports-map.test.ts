import { describe, expect, test } from "bun:test";
import type { ConfigPaths } from "../config/schema";
import { buildExportsMap } from "./exports-map";

const PATHS: ConfigPaths = {
	ui: "src/components/ui",
	lib: "src/lib",
	hooks: "src/hooks",
	styles: "src/styles",
	icons: "src/lib/icons",
};

/** What `add button` leaves behind, as namespace-relative targets. */
const WRITTEN = {
	ui: ["button/index.ts", "button/button.tsx", "button/button.variants.ts", "icon/index.ts"],
	lib: ["cn.ts", "tv.ts", "slot.tsx"],
	hooks: ["use-theme-color.ts"],
	styles: ["index.css", "tokens.css", "tokens.ts", "uniwind-env.d.ts"],
	icons: ["central.ts"],
};

describe("buildExportsMap", () => {
	test("exports a component at its folder's index, not at every file in it", () => {
		const map = buildExportsMap(PATHS, WRITTEN);

		expect(map["./button"]).toBe("./src/components/ui/button/index.ts");
		expect(map["./button/button.variants"]).toBeUndefined();
		expect(map["./icon"]).toBe("./src/components/ui/icon/index.ts");
	});

	test("exports each flat lib and hook file individually", () => {
		const map = buildExportsMap(PATHS, WRITTEN);

		expect(map["./lib/cn"]).toBe("./src/lib/cn.ts");
		expect(map["./lib/slot"]).toBe("./src/lib/slot.tsx");
		expect(map["./hooks/use-theme-color"]).toBe("./src/hooks/use-theme-color.ts");
	});

	test("exports the styles barrel and each stylesheet beside it", () => {
		const map = buildExportsMap(PATHS, WRITTEN);

		expect(map["./styles"]).toBe("./src/styles/index.css");
		expect(map["./styles/tokens"]).toBe("./src/styles/tokens.css");
	});

	test("keeps the icons re-export on its own subpath", () => {
		expect(buildExportsMap(PATHS, WRITTEN)["./icons/central"]).toBe("./src/lib/icons/central.ts");
	});

	/**
	 * A root entry would make every app resolve every optional peer, which is
	 * exactly why `delacour-react-native-ui` has none either.
	 */
	test("emits no root barrel", () => {
		expect(buildExportsMap(PATHS, WRITTEN)["."]).toBeUndefined();
	});

	test("omits type shims and tests, which are not entry points", () => {
		const map = buildExportsMap(PATHS, {
			...WRITTEN,
			styles: [...WRITTEN.styles, "tokens.test.ts"],
		});

		expect(map["./styles/uniwind-env"]).toBeUndefined();
		expect(map["./styles/tokens.test"]).toBeUndefined();
	});

	test("sorts the map, so a re-run produces no diff", () => {
		const map = buildExportsMap(PATHS, WRITTEN);
		expect(Object.keys(map)).toEqual([...Object.keys(map)].sort());
	});

	test("follows the configured paths rather than assuming a layout", () => {
		const map = buildExportsMap({ ...PATHS, ui: "components", lib: "utils" }, WRITTEN);

		expect(map["./button"]).toBe("./components/button/index.ts");
		expect(map["./lib/cn"]).toBe("./utils/cn.ts");
	});

	test("returns an empty map for a package with nothing in it yet", () => {
		expect(buildExportsMap(PATHS, { ui: [], lib: [], hooks: [], styles: [], icons: [] })).toEqual({});
	});
});

describe("nested namespaces", () => {
	/**
	 * `icons` lives inside `lib` by default. Exporting the same file twice would
	 * publish `./lib/icons/central`, which resolves but is not an entry point the
	 * package means to offer.
	 */
	test("does not export an icons file a second time through lib", () => {
		const map = buildExportsMap(PATHS, {
			ui: [],
			lib: ["cn.ts"],
			hooks: [],
			styles: [],
			icons: ["central.ts"],
		});

		expect(map["./icons/central"]).toBe("./src/lib/icons/central.ts");
		expect(map["./lib/icons/central"]).toBeUndefined();
	});
});
