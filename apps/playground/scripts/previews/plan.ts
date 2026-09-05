/**
 * Walks the demo tree and works out what a run should capture.
 *
 * Filesystem only — nothing here talks to a device, so `--only` and the skip
 * logic can be reasoned about (and tested) without booting anything.
 */

import { createHash } from "node:crypto";
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { DEMOS_DIR, DEVICE_MAX_EDGE, FLOWS_DIR, MAX_EDGE } from "./config";
import { type DemoSource, readDemoSource, readGroupOrder } from "./demo-source";

/** Mirrors `DemoFrame` in `src/demos/types.ts`, which imports React and cannot be read here. */
export type DemoFrame = "stage" | "device";

export type PlannedDemo = {
	id: string;
	component: string;
	demo: string;
	path: string;
	source: DemoSource;
	frame: DemoFrame;
	flowPath?: string;
	/** Still frames held before the flow, and after it. Defaults in `DemoCapture`. */
	leadMs: number;
	tailMs: number;
	hero: boolean;
	sourceHash: string;
};

/**
 * The component a demo belongs to: the **first** path segment, not the parent
 * directory.
 *
 * A folder gallery nests one level deeper — `screen/navbar/default` — and its
 * component is `screen`, not `screen/navbar`. Keying on the parent would demand
 * one `hero` per facet rather than one per component, and would put
 * `screen/navbar` in `heroPreviews` where the components index looks up plain
 * `screen`.
 */
function componentOf(id: string): string {
	return id.split("/")[0] as string;
}

async function walk(dir: string): Promise<string[]> {
	const found: string[] = [];
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) found.push(...(await walk(path)));
		else if (entry.name.endsWith(".tsx") && !entry.name.includes(".test.")) found.push(path);
	}
	return found;
}

/**
 * Everything a capture depends on, hashed.
 *
 * Includes the encode settings as well as the source: bumping an edge has to
 * invalidate every entry it governs, or half the media would silently stay at
 * the old size.
 *
 * It is the frame's **own** edge rather than both, so the two caps move
 * independently: raising `DEVICE_MAX_EDGE` re-captures the three device demos
 * and leaves the hundred stage ones hashing exactly as they did. Committed
 * media does not delta-compress, so a hash that mixed the two would rewrite the
 * whole tree for a change that reaches six files.
 */
function hashOf(source: DemoSource, flow: string | null, frame: DemoFrame): string {
	return createHash("sha256")
		.update(source.code)
		.update(JSON.stringify(source.meta))
		.update(flow ?? "")
		.update(`edge:${frame === "device" ? DEVICE_MAX_EDGE : MAX_EDGE}`)
		.digest("hex")
		.slice(0, 12);
}

/** Every demo that opts into capture, in each component's own barrel order. */
export async function planDemos(only?: string): Promise<PlannedDemo[]> {
	const files = await walk(DEMOS_DIR);
	const planned: PlannedDemo[] = [];

	for (const path of files) {
		const id = relative(DEMOS_DIR, path).replace(/\.tsx$/, "");
		if (only && id !== only && !id.startsWith(`${only}/`)) continue;

		const source = await readDemoSource(path);
		if (!source.meta.capture) continue;

		const capture = source.meta.capture;
		const frame: DemoFrame = capture.frame ?? "stage";
		const flowPath = capture.flow ? join(FLOWS_DIR, `${capture.flow}.yaml`) : undefined;
		const flowText = flowPath && (await Bun.file(flowPath).exists()) ? await Bun.file(flowPath).text() : null;

		planned.push({
			component: componentOf(id),
			demo: id.slice(componentOf(id).length + 1),
			flowPath,
			frame,
			leadMs: capture.leadMs ?? 400,
			tailMs: capture.tailMs ?? 800,
			hero: capture.hero === true,
			id,
			path,
			source,
			sourceHash: hashOf(source, flowText, frame),
		});
	}

	return sortByBarrelOrder(planned);
}

/**
 * Orders each component's demos the way its barrel does.
 *
 * The barrel is where somebody decided the Switch page opens with the gesture
 * rather than with "A glyph in the knob"; alphabetical would throw that away.
 */
async function sortByBarrelOrder(planned: PlannedDemo[]): Promise<PlannedDemo[]> {
	const orders = new Map<string, string[]>();

	for (const component of new Set(planned.map((demo) => demo.component))) {
		const barrel = join(DEMOS_DIR, component, "index.ts");
		orders.set(component, (await Bun.file(barrel).exists()) ? await readGroupOrder(barrel) : []);
	}

	const rank = (demo: PlannedDemo): number => {
		const index = orders.get(demo.component)?.indexOf(demo.demo) ?? -1;
		return index === -1 ? Number.MAX_SAFE_INTEGER : index;
	};

	return planned.sort(
		(a, b) => a.component.localeCompare(b.component) || rank(a) - rank(b) || a.demo.localeCompare(b.demo)
	);
}
