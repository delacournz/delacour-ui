import type { Namespace } from "./namespaces";

/**
 * Maps a path inside `packages/native-ui/src` onto the registry item it
 * belongs to and where it lands in a consumer's project.
 *
 * The rules here are `native-ui`'s own conventions, restated — one component
 * per folder with an `index.ts` entry point, flat files under `lib/`, `hooks/`
 * and `icons/`. `packages/native-ui/scripts/gen-exports.ts` reads the same
 * shape to build the package's `exports` map, so a component folder that is
 * malformed fails there first.
 *
 * Pure and filesystem-free, so the whole mapping is reachable from `bun test`.
 */

export const REGISTRY_TYPES = ["registry:ui", "registry:lib", "registry:hook", "registry:style"] as const;

export type RegistryType = (typeof REGISTRY_TYPES)[number];

export type SourceClassification = {
	/** The registry item this file belongs to — what a user types after `add`. */
	item: string;
	type: RegistryType;
	namespace: Namespace;
	/** Namespace-relative destination, e.g. `button/button.tsx`, `cn.ts`. */
	target: string;
	/**
	 * Namespace-relative import id, extension dropped and a trailing `/index`
	 * collapsed. `null` for a file that is never imported from TypeScript.
	 */
	moduleId: string | null;
};

const SOURCE_EXTENSIONS = [".ts", ".tsx"] as const;

/** The type-only shim that has to travel with the styles it types. */
const UNIWIND_ENV = "uniwind-env.d.ts";

/**
 * Classifies one source path, or returns `null` for a file the registry does
 * not ship.
 *
 * Tests are dropped rather than rewritten: `button.variants.test.ts` imports
 * `bun:test` and reaches at internals the consumer has no reason to hold, and
 * shipping a test that cannot run is worse than shipping none.
 */
export function classifySource(path: string): SourceClassification | null {
	if (isTest(path)) return null;
	if (path === UNIWIND_ENV) {
		return { item: "styles", type: "registry:style", namespace: "styles", target: UNIWIND_ENV, moduleId: null };
	}

	const [directory, ...rest] = path.split("/");
	if (!directory || rest.length === 0) return null;

	return DIRECTORIES[directory]?.(rest) ?? null;
}

/** One classifier per source directory. Anything else is not registry source. */
const DIRECTORIES: Record<string, (rest: string[]) => SourceClassification | null> = {
	components: classifyComponent,
	// A lib file or a hook is its own item, named for the file.
	lib: (rest) => classifyOwnItem(rest, "lib", "registry:lib"),
	hooks: (rest) => classifyOwnItem(rest, "hooks", "registry:hook"),
	// These are whole-directory items instead: `icons` re-exports one set, the
	// styles only make sense as the complete layer stack, and `expo` is one
	// integration seam rather than a menu of helpers.
	icons: (rest) => classifyDirectoryItem(rest, { item: "icons", namespace: "icons", type: "registry:lib" }),
	styles: (rest) => classifyDirectoryItem(rest, { item: "styles", namespace: "styles", type: "registry:style" }),
	// Lands under the consumer's lib directory rather than claiming a namespace
	// of its own: it is a helper that happens to import from expo-router, and a
	// sixth configurable path would be one more thing to answer at `init`.
	expo: (rest) =>
		classifyDirectoryItem(rest, { item: "expo", namespace: "lib", type: "registry:lib", prefix: "expo/" }),
};

/** A component is a folder; a bare file directly under `components/` is not one. */
function classifyComponent(rest: string[]): SourceClassification | null {
	const [folder, ...within] = rest;
	if (!folder || within.length === 0) return null;

	const target = [folder, ...within].join("/");
	return { item: folder, type: "registry:ui", namespace: "ui", target, moduleId: toModuleId(target) };
}

function classifyOwnItem(rest: string[], namespace: Namespace, type: RegistryType): SourceClassification | null {
	const target = onlyFile(rest);
	if (!target) return null;

	const moduleId = toModuleId(target);
	if (moduleId === null) return null;

	return { item: moduleId, type, namespace, target, moduleId };
}

type DirectoryItem = {
	item: string;
	namespace: Namespace;
	type: RegistryType;
	/** Kept in front of the target, so `expo/` survives into the consumer's tree. */
	prefix?: string;
};

function classifyDirectoryItem(rest: string[], options: DirectoryItem): SourceClassification | null {
	const file = onlyFile(rest);
	if (!file) return null;

	const target = `${options.prefix ?? ""}${file}`;
	return { item: options.item, type: options.type, namespace: options.namespace, target, moduleId: toModuleId(target) };
}

/** These directories are flat, so a nested path is not something to guess at. */
function onlyFile(rest: string[]): string | null {
	return rest.length === 1 ? (rest[0] as string) : null;
}

/**
 * Resolves a relative import specifier to the source path it names.
 *
 * `known` is the list of files the registry is being built from, so resolution
 * is a lookup rather than a stat — the builder already read the tree, and a
 * specifier that resolves outside it is a genuine error worth surfacing.
 */
export function resolveModuleId(fromPath: string, specifier: string, known: readonly string[]): string | null {
	if (!specifier.startsWith(".")) return null;

	const base = joinRelative(dirname(fromPath), specifier);
	const candidates = [
		...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`),
		...SOURCE_EXTENSIONS.map((extension) => `${base}/index${extension}`),
		base,
	];

	return candidates.find((candidate) => known.includes(candidate)) ?? null;
}

function isTest(path: string): boolean {
	return /\.test\.tsx?$/.test(path);
}

/** `button/index.ts` → `button`; `cn.ts` → `cn`; `theme.css` → `null`. */
function toModuleId(target: string): string | null {
	const extension = SOURCE_EXTENSIONS.find((candidate) => target.endsWith(candidate));
	if (!extension) return null;

	const withoutExtension = target.slice(0, -extension.length);
	return withoutExtension.endsWith("/index") ? withoutExtension.slice(0, -"/index".length) : withoutExtension;
}

function dirname(path: string): string {
	const slash = path.lastIndexOf("/");
	return slash === -1 ? "" : path.slice(0, slash);
}

/** POSIX-only `join`, so the builder produces the same paths on any platform. */
function joinRelative(from: string, specifier: string): string {
	const segments = from.length === 0 ? [] : from.split("/");

	for (const segment of specifier.split("/")) {
		if (segment === "." || segment === "") continue;
		if (segment === "..") segments.pop();
		else segments.push(segment);
	}

	return segments.join("/");
}
