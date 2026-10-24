import { describe, expect, test } from "bun:test";
import {
	type Affected,
	affectedPreviews,
	buildImportGraph,
	isExempt,
	recaptureCommand,
	type SourceFile,
} from "./affected-previews";

const UI = "packages/react-native-ui/src";
const DEMOS = "apps/playground/src/demos";

/** A small tree: Button, a Dialog that renders it, a Card whose demo does, a chart on the engine. */
const FILES: SourceFile[] = [
	{ code: `import { cn } from "../../lib/cn";`, path: `${UI}/components/button/button.tsx` },
	{ code: `import { tv } from "../../lib/tv";`, path: `${UI}/components/button/button.variants.ts` },
	{ code: `export * from "./button";\nexport * from "./button.variants";`, path: `${UI}/components/button/index.ts` },
	{
		code: `import { Button } from "../button";\nimport { cn } from "../../lib/cn";`,
		path: `${UI}/components/dialog/dialog.tsx`,
	},
	{ code: `export * from "./dialog";`, path: `${UI}/components/dialog/index.ts` },
	{ code: `import { View } from "react-native";`, path: `${UI}/components/card/card.tsx` },
	{ code: `export * from "./card";`, path: `${UI}/components/card/index.ts` },
	{ code: `import { Chart } from "@delacour/react-native-charts";`, path: `${UI}/components/chart/chart.tsx` },
	{ code: `export * from "./chart";`, path: `${UI}/components/chart/index.ts` },
	{ code: `import { View } from "react-native";`, path: `${UI}/components/unshown/unshown.tsx` },
	{ code: `export * from "./unshown";`, path: `${UI}/components/unshown/index.ts` },
	{ code: `export const cn = (...c: string[]) => c.join(" ");`, path: `${UI}/lib/cn.ts` },
	{ code: `export const tv = () => null;`, path: `${UI}/lib/tv.ts` },
	{
		code: `import { Card } from "@delacour/react-native-ui/card";\nimport { Button } from "@delacour/react-native-ui/button";`,
		path: `${DEMOS}/card/with-actions.tsx`,
	},
	{ code: `import { Chart } from "@delacour/react-native-charts";`, path: `${DEMOS}/charts/line.tsx` },
	{ code: `import { Button } from "@delacour/react-native-ui/button";`, path: `${DEMOS}/button/variants.tsx` },
];

const PREVIEWED = new Set(["button", "dialog", "card", "chart", "charts"]);
const graph = buildImportGraph(FILES);

function names(affected: Affected): string[] {
	return affected.kind === "components" ? affected.components.map((c) => c.name) : [];
}

describe("buildImportGraph", () => {
	test("resolves a relative import to a file, an index, or a .tsx", () => {
		expect(graph.get(`${UI}/components/dialog/dialog.tsx`)).toEqual(
			new Set([`${UI}/components/button/index.ts`, `${UI}/lib/cn.ts`])
		);
	});

	test("resolves a library subpath to the component's index, and an engine to its package", () => {
		expect(graph.get(`${DEMOS}/card/with-actions.tsx`)).toEqual(
			new Set([`${UI}/components/card/index.ts`, `${UI}/components/button/index.ts`])
		);
		expect(graph.get(`${UI}/components/chart/chart.tsx`)).toEqual(new Set(["@delacour/react-native-charts"]));
	});

	test("ignores a third-party import", () => {
		expect(graph.get(`${UI}/components/card/card.tsx`)).toEqual(new Set());
	});
});

describe("isExempt", () => {
	test.each([
		`${UI}/components/button/button.variants.test.ts`,
		`${UI}/components/button/AGENTS.md`,
		`${UI}/components/button/button.fixtures.ts`,
		`${UI}/components/button/button.test-helpers.ts`,
		`${UI}/uniwind-env.d.ts`,
	])("%s draws nothing", (path) => {
		expect(isExempt(path)).toBe(true);
	});

	test("a variants file draws", () => {
		expect(isExempt(`${UI}/components/button/button.variants.ts`)).toBe(false);
	});
});

describe("affectedPreviews", () => {
	test("nothing that draws changed", () => {
		const affected = affectedPreviews({
			changed: [`${UI}/components/button/AGENTS.md`, `${UI}/components/button/button.variants.test.ts`, "README.md"],
			graph,
			previewed: PREVIEWED,
		});
		expect(affected).toEqual({ kind: "none" });
	});

	test("a component change reaches every component and demo that renders it, and needs --force", () => {
		const affected = affectedPreviews({
			changed: [`${UI}/components/button/button.variants.ts`],
			graph,
			previewed: PREVIEWED,
		});
		expect(names(affected)).toEqual(["button", "card", "dialog"]);
		expect(affected.kind === "components" && affected.force).toBe(true);
	});

	test("says which changed file reached each component", () => {
		const affected = affectedPreviews({
			changed: [`${UI}/components/button/button.tsx`],
			graph,
			previewed: PREVIEWED,
		});
		expect(affected.kind === "components" && affected.components).toContainEqual({
			name: "dialog",
			via: `${UI}/components/button/button.tsx`,
		});
	});

	test("a shared lib change reaches everything that imports it", () => {
		const affected = affectedPreviews({ changed: [`${UI}/lib/cn.ts`], graph, previewed: PREVIEWED });
		expect(names(affected)).toEqual(["button", "card", "dialog"]);
	});

	test("a demo-only change needs no --force: the demo's own hash moved", () => {
		const affected = affectedPreviews({
			changed: [`${DEMOS}/card/with-actions.tsx`, "apps/playground/e2e/previews/card.e2e.ts"],
			graph,
			previewed: PREVIEWED,
		});
		expect(affected).toEqual({
			components: [{ name: "card", via: `${DEMOS}/card/with-actions.tsx` }],
			force: false,
			kind: "components",
		});
	});

	test("an engine change reaches the component that skins it and the engine's own gallery", () => {
		const affected = affectedPreviews({
			changed: ["packages/react-native-charts/src/line.tsx"],
			graph,
			previewed: PREVIEWED,
		});
		expect(names(affected)).toEqual(["chart", "charts"]);
		expect(affected.kind === "components" && affected.force).toBe(true);
	});

	test("a component with no preview spec is dropped", () => {
		const affected = affectedPreviews({
			changed: [`${UI}/components/unshown/unshown.tsx`],
			graph,
			previewed: PREVIEWED,
		});
		expect(affected).toEqual({ kind: "none" });
	});

	test.each([
		"apps/playground/src/app/preview.tsx",
		"apps/playground/e2e/previews/capture.ts",
		`${UI}/styles/theme.css`,
		"apps/playground/src/styles/global.css",
	])("the capture harness or a stylesheet (%s) touches every preview", (path) => {
		expect(affectedPreviews({ changed: [path], graph, previewed: PREVIEWED })).toEqual({ kind: "all", via: path });
	});

	test("a harness test is still exempt", () => {
		expect(
			affectedPreviews({ changed: ["apps/playground/e2e/previews/geometry.test.ts"], graph, previewed: PREVIEWED })
		).toEqual({ kind: "none" });
	});
});

describe("recaptureCommand", () => {
	test("nothing to run", () => {
		expect(recaptureCommand({ kind: "none" })).toBeUndefined();
	});

	test("everything, forced", () => {
		expect(recaptureCommand({ kind: "all", via: "x" })).toBe("bun run previews -- -- --force --headless");
	});

	test("a selection, forced only when a demo's own hash did not move", () => {
		const components = [
			{ name: "button", via: "a" },
			{ name: "dialog", via: "a" },
		];
		expect(recaptureCommand({ components, force: true, kind: "components" })).toBe(
			"bun run previews -- -- --only button,dialog --force --headless"
		);
		expect(recaptureCommand({ components, force: false, kind: "components" })).toBe(
			"bun run previews -- -- --only button,dialog --headless"
		);
	});
});
