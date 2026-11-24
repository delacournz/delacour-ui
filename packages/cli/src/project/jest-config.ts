import { existsSync, readdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import type { ResolvedConfig } from "../config/resolve";

/**
 * Wires a project's Jest up for the render tests (`*.render.test.tsx`).
 *
 * A render test needs four things of Jest, and none of them is the test kit's
 * to supply by itself: the kit's `setup.ts` listed in `setupFiles` (it mocks
 * every native module), Reanimated's resolver (without it worklets and
 * Reanimated load their `.native` entries and crash), the engines and
 * ESM-only packages let through `transformIgnorePatterns`, and a `transform`
 * for `.mjs` — d3-shape 3.2.1 ships only `dist/d3-shape.mjs`, and `jest-expo`'s
 * Babel transform matches `.js`/`.ts` alone, so letting it through is not enough. `ensureJestConfig`
 * adds whichever is missing and nothing else, so it can run on every `add` and
 * `update` and leave a configured project byte for byte as it was.
 *
 * Only the shapes that can be edited without guessing are edited: the `jest`
 * key of `package.json`, and a `jest.config.*` whose config is an object
 * literal. Anything else — a config built by a function, a `resolver` that is
 * already something else — is left exactly as it is and returned as a snippet
 * for the user to place, rather than rewritten in a way that might change what
 * their other tests do.
 */

/** Without it Reanimated and worklets resolve their `.native` entry points and throw under Node. */
export const JEST_RESOLVER = "react-native-reanimated/jest/resolver";

/** The `transform` key that compiles `.mjs`, which `jest-expo`'s `\.[jt]sx?$` does not match. */
export const MJS_TRANSFORM_PATTERN = "^.+\\.mjs$";
export const MJS_TRANSFORMER = "babel-jest";

/** Whether a config's text already names a transform for `.mjs`. */
export function compilesMjs(text: string): boolean {
	return /\btransform\b["']?\s*:\s*\{[^}]*mjs/.test(text);
}

/** What `transformIgnorePatterns` has to let through, beside whatever the preset already does. */
export const RENDER_TRANSFORMS = [
	"@delacour/.*",
	"d3-.*",
	"internmap",
	"uniwind",
	"@legendapp/.*",
	"@maplibre/.*",
	"@central-icons-react-native/.*",
] as const;

/** `jest-expo`'s own pattern, written out for a project that sets none of its own and so inherits it. */
const EXPO_IGNORE =
	"node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)";

const LOOKAHEAD = "(?!";

export type JestConfigObject = Record<string, unknown>;

/** What a patch could not do on its own, as sentences to show beside the snippet. */
type Patch<T> = { value: T; changed: boolean; manual: string[] };

export type JestPatchResult =
	| { status: "unchanged"; file: string }
	| { status: "patched"; file: string }
	| { status: "manual"; file: string | null; snippet: string; reasons: string[] };

const SOURCE_CONFIGS = ["jest.config.js", "jest.config.ts", "jest.config.cjs", "jest.config.mjs"] as const;

/** `<rootDir>/…` path of the kit's setup file, from the directory the Jest config sits in. */
export function setupFileFor(rootDir: string, config: ResolvedConfig): string {
	const path = relative(rootDir, join(config.directories.lib, "test", "setup.ts"))
		.split(sep)
		.join("/");
	return `<rootDir>/${path}`;
}

/**
 * `<rootDir>/…` paths of the native mocks copied beside the kit — `lib/test/mocks/*.ts`, one per
 * module only some components bring. Read off disk, so a mock is listed exactly when its component
 * copied it.
 */
export function mockSetupFilesFor(rootDir: string, config: ResolvedConfig): string[] {
	const directory = join(config.directories.lib, "test", "mocks");
	if (!existsSync(directory)) return [];
	return readdirSync(directory)
		.filter((name) => /\.tsx?$/.test(name))
		.sort()
		.map((name) => `<rootDir>/${relative(rootDir, join(directory, name)).split(sep).join("/")}`);
}

/** Where `file` goes among `existing`: after the file before it in `wanted`, else first. */
function insertInOrder(existing: readonly unknown[], wanted: readonly string[]): unknown[] {
	const next = [...existing];
	wanted.forEach((file, index) => {
		if (next.includes(file)) return;
		const previous = index === 0 ? -1 : next.indexOf(wanted[index - 1]);
		next.splice(previous + 1, 0, file);
	});
	return next;
}

function missingTransforms(text: string): string[] {
	return RENDER_TRANSFORMS.filter((transform) => !text.includes(transform));
}

/** Inserts the missing alternatives straight after the lookahead's `(?!`, where they sit beside the preset's own. */
function widenPattern(pattern: string, missing: readonly string[]): string | null {
	const at = pattern.indexOf(LOOKAHEAD);
	if (at === -1 || !pattern.startsWith("node_modules/")) return null;
	const insertAt = at + LOOKAHEAD.length;
	return `${pattern.slice(0, insertAt)}${missing.join("|")}|${pattern.slice(insertAt)}`;
}

function fullPattern(): string {
	return widenPattern(EXPO_IGNORE, RENDER_TRANSFORMS) as string;
}

/** The exact lines to add, for the parts a patch could not make. */
export function jestSnippet(setupFile: string | readonly string[]): string {
	return [
		"{",
		`  setupFiles: [${listOf(setupFile)
			.map((file) => `"${file}"`)
			.join(", ")}],`,
		`  resolver: "${JEST_RESOLVER}",`,
		`  transformIgnorePatterns: ["${fullPattern()}"],`,
		`  transform: { ${JSON.stringify(MJS_TRANSFORM_PATTERN)}: "${MJS_TRANSFORMER}" },`,
		"}",
	].join("\n");
}

/** Patches a parsed `jest` config (`package.json`'s key, or JSON). Returns a copy. */
export function patchJestJson(
	config: JestConfigObject,
	setupFile: string | readonly string[]
): Patch<JestConfigObject> & { config: JestConfigObject } {
	const next: JestConfigObject = { ...config };
	const manual: string[] = [];
	let changed = false;
	const files = listOf(setupFile);

	const setup = Array.isArray(next.setupFiles) ? (next.setupFiles as unknown[]) : null;
	if (next.setupFiles === undefined) {
		next.setupFiles = [...files];
		changed = true;
	} else if (setup && files.some((file) => !setup.includes(file))) {
		next.setupFiles = insertInOrder(setup, files);
		changed = true;
	} else if (!setup) {
		manual.push(`setupFiles is not a list — add ${files.map((file) => `"${file}"`).join(", ")} to it.`);
	}

	if (next.resolver === undefined) {
		next.resolver = JEST_RESOLVER;
		changed = true;
	} else if (next.resolver !== JEST_RESOLVER) {
		manual.push(`resolver is already set — it has to be "${JEST_RESOLVER}", or wrap it.`);
	}

	const patterns = Array.isArray(next.transformIgnorePatterns) ? (next.transformIgnorePatterns as unknown[]) : null;
	if (next.transformIgnorePatterns === undefined) {
		next.transformIgnorePatterns = [fullPattern()];
		changed = true;
	} else {
		const missing = missingTransforms(JSON.stringify(next.transformIgnorePatterns));
		if (missing.length > 0) {
			const at =
				patterns?.findIndex((entry) => typeof entry === "string" && entry.includes(`node_modules/${LOOKAHEAD}`)) ?? -1;
			const widened = at === -1 ? null : widenPattern(patterns?.[at] as string, missing);
			if (patterns && widened) {
				next.transformIgnorePatterns = patterns.map((entry, index) => (index === at ? widened : entry));
				changed = true;
			} else {
				manual.push(
					`transformIgnorePatterns has to let ${missing.join(", ")} through — add them inside the \`node_modules/(?!…)\` pattern.`
				);
			}
		}
	}

	if (next.transform === undefined) {
		next.transform = { [MJS_TRANSFORM_PATTERN]: MJS_TRANSFORMER };
		changed = true;
	} else if (isRecord(next.transform)) {
		if (!Object.keys(next.transform).some((key) => key.includes("mjs"))) {
			next.transform = { ...next.transform, [MJS_TRANSFORM_PATTERN]: MJS_TRANSFORMER };
			changed = true;
		}
	} else {
		manual.push(
			`transform is not an object — add ${JSON.stringify(MJS_TRANSFORM_PATTERN)}: "${MJS_TRANSFORMER}" so .mjs compiles.`
		);
	}

	return { value: next, config: next, changed, manual };
}

const CONFIG_OBJECT = /(?:export\s+default|module\.exports\s*=)\s*\{|(?:const|let|var)\s+config\b[^=\n]*=\s*\{/;

/** Patches the text of a `jest.config.*` whose config is an object literal. */
export function patchJestSource(text: string, setupFile: string | readonly string[]): Patch<string> & { text: string } {
	const files = listOf(setupFile);
	const opening = CONFIG_OBJECT.exec(text);
	if (!opening) {
		return { value: text, text, changed: false, manual: ["the config is not an object literal this can edit."] };
	}

	let next = text;
	const manual: string[] = [];
	const added: string[] = [];
	let changed = false;

	if (/\bsetupFiles\s*:/.test(next)) {
		const array = /\bsetupFiles\s*:\s*\[/.exec(next);
		for (const [index, file] of files.entries()) {
			if (next.includes(file)) continue;
			if (!array) {
				manual.push(`setupFiles is not a list literal — add "${file}" to it.`);
				continue;
			}
			// After the file before it when that one is quoted in the list, else first in it.
			const previous = index === 0 ? -1 : next.indexOf(`"${files[index - 1]}"`);
			if (previous !== -1) {
				const at = previous + `"${files[index - 1]}"`.length;
				next = `${next.slice(0, at)}, "${file}"${next.slice(at)}`;
			} else {
				const at = (/\bsetupFiles\s*:\s*\[/.exec(next) as RegExpExecArray).index + array[0].length;
				const separator = /^\s*\]/.test(next.slice(at)) ? "" : ", ";
				next = `${next.slice(0, at)}"${file}"${separator}${next.slice(at)}`;
			}
			changed = true;
		}
	} else added.push(`setupFiles: [${files.map((file) => `"${file}"`).join(", ")}],`);

	if (/\bresolver\s*:/.test(next)) {
		if (!next.includes(JEST_RESOLVER))
			manual.push(`resolver is already set — it has to be "${JEST_RESOLVER}", or wrap it.`);
	} else added.push(`resolver: "${JEST_RESOLVER}",`);

	if (/\btransformIgnorePatterns\s*:/.test(next)) {
		const missing = missingTransforms(next);
		if (missing.length > 0) {
			const at = next.indexOf(`node_modules/${LOOKAHEAD}`);
			if (at !== -1) {
				const insertAt = at + `node_modules/${LOOKAHEAD}`.length;
				next = `${next.slice(0, insertAt)}${missing.join("|")}|${next.slice(insertAt)}`;
				changed = true;
			} else
				manual.push(
					`transformIgnorePatterns has to let ${missing.join(", ")} through — add them inside the \`node_modules/(?!…)\` pattern.`
				);
		}
	} else added.push(`transformIgnorePatterns: [${JSON.stringify(fullPattern())}],`);

	if (/\btransform\s*:/.test(next)) {
		if (!compilesMjs(next))
			manual.push(
				`transform is already set — add ${JSON.stringify(MJS_TRANSFORM_PATTERN)}: "${MJS_TRANSFORMER}" so .mjs compiles.`
			);
	} else added.push(`transform: { ${JSON.stringify(MJS_TRANSFORM_PATTERN)}: "${MJS_TRANSFORMER}" },`);

	if (added.length > 0) {
		// Re-find the brace: the edits above only ever land after it.
		const brace = CONFIG_OBJECT.exec(next) as RegExpExecArray;
		const at = brace.index + brace[0].length;
		next = `${next.slice(0, at)}\n${added.map((line) => `\t${line}`).join("\n")}${next.slice(at)}`;
		changed = true;
	}

	return { value: next, text: next, changed, manual };
}

/** Why a Jest config's text will not run the render tests. Empty when it will. */
export function renderSetupIssues(
	configText: string,
	setupFile: string | readonly string[],
	mocks: readonly string[] = []
): string[] {
	const candidates = typeof setupFile === "string" ? [setupFile] : setupFile;
	const issues: string[] = [];
	if (!candidates.some((candidate) => configText.includes(candidate))) {
		issues.push(`setupFiles does not list ${candidates[0] ?? "the test kit's setup.ts"}`);
	}
	const unlisted = mocks.filter((name) => !configText.includes(`test/mocks/${name}`));
	if (unlisted.length > 0) issues.push(`setupFiles does not list the copied mock ${unlisted.join(", ")}`);
	if (!configText.includes(JEST_RESOLVER)) issues.push(`resolver is not ${JEST_RESOLVER}`);

	const missing = missingTransforms(configText);
	if (missing.length > 0) issues.push(`transformIgnorePatterns does not let ${missing.join(", ")} through`);
	if (!compilesMjs(configText)) issues.push("transform does not compile .mjs, which d3-shape ships");
	return issues;
}

/**
 * Makes the project's Jest config run the render tests, and says what it did.
 *
 * The config is looked for beside `native-components.json` and then in the
 * app, a `jest.config.*` before `package.json`'s `jest` key, as `doctor` reads
 * it. A project with no Jest config at all gets a `jest` key with the
 * `jest-expo` preset.
 */
export async function ensureJestConfig(config: ResolvedConfig): Promise<JestPatchResult> {
	const roots = [...new Set([config.root, config.app.resolved.root])];

	for (const root of roots) {
		for (const name of SOURCE_CONFIGS) {
			const path = join(root, name);
			if (!existsSync(path)) continue;

			const setupFile = setupFileFor(root, config);
			const setupFiles = [setupFile, ...mockSetupFilesFor(root, config)];
			const text = await readFile(path, "utf-8");
			const patch = patchJestSource(text, setupFiles);
			return finish(name, setupFiles, patch, patch.changed ? () => writeFile(path, patch.text, "utf-8") : null);
		}
	}

	for (const root of roots) {
		const path = join(root, "package.json");
		if (!existsSync(path)) continue;

		const raw = await readFile(path, "utf-8");
		const manifest = JSON.parse(raw) as Record<string, unknown>;
		const setupFile = setupFileFor(root, config);
		const setupFiles = [setupFile, ...mockSetupFilesFor(root, config)];
		const current = isRecord(manifest.jest)
			? manifest.jest
			: manifest.jest === undefined
				? { preset: "jest-expo" }
				: null;
		if (!current) {
			return finish("package.json", setupFiles, {
				manual: ["`jest` in package.json is not an object."],
				changed: false,
			});
		}

		const patch = patchJestJson(current, setupFiles);
		const created = manifest.jest === undefined;
		return finish(
			"package.json",
			setupFiles,
			{ ...patch, changed: patch.changed || created },
			patch.changed || created
				? () =>
						writeFile(path, `${JSON.stringify({ ...manifest, jest: patch.config }, null, indentOf(raw))}\n`, "utf-8")
				: null
		);
	}

	return {
		status: "manual",
		file: null,
		snippet: jestSnippet(setupFileFor(config.root, config)),
		reasons: ["there is no package.json or jest.config.* to add it to."],
	};
}

async function finish(
	file: string,
	setupFile: string | readonly string[],
	patch: { changed: boolean; manual: string[] },
	write?: (() => Promise<void>) | null
): Promise<JestPatchResult> {
	if (patch.manual.length > 0) {
		return { status: "manual", file, snippet: jestSnippet(setupFile), reasons: patch.manual };
	}
	if (!patch.changed || !write) return { status: "unchanged", file };

	await write();
	return { status: "patched", file };
}

/** The indent the file already uses, so a patched `package.json` diffs as a few lines. */
function indentOf(raw: string): string {
	return /^([ \t]+)"/m.exec(raw)?.[1] ?? "\t";
}

function listOf(setupFile: string | readonly string[]): readonly string[] {
	return typeof setupFile === "string" ? [setupFile] : setupFile;
}

function isRecord(value: unknown): value is JestConfigObject {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
