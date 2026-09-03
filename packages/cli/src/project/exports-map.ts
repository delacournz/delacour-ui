import type { ConfigPaths } from "../config/schema";
import type { Namespace } from "../registry/namespaces";

/**
 * Builds a shared package's `exports` map from the files the CLI wrote.
 *
 * The conventions are `delacour-react-native-ui`'s, restated — see
 * `packages/native-ui/scripts/gen-exports.ts`, which produces the same shape for
 * the library itself. A component is exported once, at its folder's `index.ts`;
 * flat files under `lib`, `hooks` and `icons` are exported individually.
 *
 * Granular on purpose, and **no root `"."` entry**: a barrel would make every
 * consuming app resolve every optional peer, which is the reason the library
 * has none. An app that never imports `./bottom-sheet` never makes Metro
 * resolve `@gorhom/bottom-sheet`.
 *
 * Pure — it takes the file lists rather than reading the disk, so the whole
 * mapping is reachable from `bun test`.
 */

/** Namespace-relative targets, as written: `button/index.ts`, `cn.ts`. */
export type WrittenFiles = Record<Namespace, readonly string[]>;

export type ExportsMap = Record<string, string>;

const SOURCE_EXTENSIONS = [".ts", ".tsx"] as const;

export function buildExportsMap(paths: ConfigPaths, written: WrittenFiles): ExportsMap {
	const map: ExportsMap = {};

	// One entry per component folder, at its index.
	for (const target of written.ui) {
		const folder = target.split("/")[0];
		if (!folder || !isIndex(target)) continue;
		map[`./${folder}`] = `./${paths.ui}/${target}`;
	}

	for (const [namespace, prefix] of [
		["lib", "./lib/"],
		["hooks", "./hooks/"],
		["icons", "./icons/"],
	] as const) {
		for (const target of written[namespace]) {
			const id = entryPointId(target);
			if (id === null) continue;
			map[`${prefix}${id}`] = `./${paths[namespace]}/${target}`;
		}
	}

	// The styles barrel is `./styles`; the sheets beside it keep their own name,
	// and `tokens.ts` is reachable as `./styles/tokens` only through the CSS of
	// the same name — so stylesheets win where the two collide.
	for (const target of written.styles) {
		if (!target.endsWith(".css")) continue;
		const id = target.slice(0, -".css".length);
		map[id === "index" ? "./styles" : `./styles/${id}`] = `./${paths.styles}/${target}`;
	}

	return sorted(map);
}

function isIndex(target: string): boolean {
	return SOURCE_EXTENSIONS.some((extension) => target.endsWith(`/index${extension}`));
}

/**
 * A flat file's export id, or `null` when it is not an entry point.
 *
 * A `.d.ts` shim types the package rather than exporting from it, and a test
 * reaches at internals a consumer has no reason to import.
 */
function entryPointId(target: string): string | null {
	if (target.endsWith(".d.ts") || /\.test\.tsx?$/.test(target)) return null;

	const extension = SOURCE_EXTENSIONS.find((candidate) => target.endsWith(candidate));
	return extension ? target.slice(0, -extension.length) : null;
}

/** Sorted, so regenerating the map after an `add` produces no spurious diff. */
function sorted(map: ExportsMap): ExportsMap {
	return Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)));
}
