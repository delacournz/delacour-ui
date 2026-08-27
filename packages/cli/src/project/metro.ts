import { dirname, relative, sep } from "node:path";

/**
 * Wraps the app's Metro config with Uniwind's.
 *
 * `withUniwindConfig` has to stay the outermost wrapper — it installs the
 * transformer that compiles `className` into styles, and a wrapper applied
 * after it can replace the `transformer` key and leave every component
 * unstyled with nothing logged. So the patch rewrites the export itself rather
 * than inserting a line somewhere in the middle.
 *
 * When the export is not in a shape this can safely rewrite, it says so and
 * prints what to write. Guessing at an unfamiliar config file earns nothing —
 * the failure it causes is a Metro error at bundle time in someone else's app.
 */

/** Modules that must resolve to exactly one copy across a workspace. */
export const PINNED_MODULES = [
	"react",
	"react-native",
	"react-native-gesture-handler",
	"react-native-reanimated",
	"react-native-safe-area-context",
	"react-native-svg",
	"react-native-worklets",
] as const;

export type MetroPatchOptions = {
	/** Absolute path to `metro.config.js`. */
	metroConfigPath: string;
	/** Absolute path to the Tailwind entry. */
	cssPath: string;
	/** Absolute path to the generated `className` types. */
	typesPath: string;
	/** Absolute workspace root, when the components live in a package outside the app. */
	workspaceRoot?: string;
};

export type MetroPatch =
	| { status: "created" | "patched"; content: string }
	| { status: "already-wired" }
	| { status: "manual"; snippet: string };

const REQUIRE = 'const { withUniwindConfig } = require("uniwind/metro");';
const IMPORT = 'import { withUniwindConfig } from "uniwind/metro";';

/** `module.exports = config;` or `export default config;`, with nothing after it. */
const COMMONJS_EXPORT = /module\.exports\s*=\s*([\s\S]+?);?\s*$/;
const ESM_EXPORT = /export default\s+([\s\S]+?);?\s*$/;

export function patchMetroConfig(existing: string | null, options: MetroPatchOptions): MetroPatch {
	const wrapper = optionsLiteral(options);

	const monorepo =
		options.workspaceRoot && options.workspaceRoot !== options.metroConfigPath
			? monorepoResolverBlock(dirname(options.metroConfigPath), options.workspaceRoot)
			: "";

	if (existing === null) return { status: "created", content: template(wrapper, monorepo) };
	if (existing.includes("withUniwindConfig")) return { status: "already-wired" };

	const isEsm = /^\s*(import|export default)/m.test(existing);
	const pattern = isEsm ? ESM_EXPORT : COMMONJS_EXPORT;
	const match = pattern.exec(existing);

	if (!match?.[1]) return { status: "manual", snippet: manualSnippet(wrapper, isEsm) };

	const keyword = isEsm ? "export default" : "module.exports =";
	const head = existing.slice(0, match.index);
	const wrapped = `${keyword} withUniwindConfig(${match[1].trim()}, ${wrapper});\n`;

	// The resolver block goes between the config and the export: it mutates
	// `config`, so it has to run after `getDefaultConfig` and before the wrap.
	const body = monorepo ? `${head}${monorepo}\n` : head;

	return { status: "patched", content: `${isEsm ? IMPORT : REQUIRE}\n${body}${wrapped}` };
}

function optionsLiteral(options: MetroPatchOptions): string {
	const from = dirname(options.metroConfigPath);
	return `{\n\tcssEntryFile: "${toSpecifier(from, options.cssPath)}",\n\tdtsFile: "${toSpecifier(from, options.typesPath)}",\n}`;
}

/**
 * The resolver settings an app needs to reach a package outside its own tree.
 *
 * Metro resolves by walking `node_modules` from the app downwards, so without
 * `watchFolders` and `nodeModulesPaths` it simply cannot see a sibling package —
 * the import fails at bundle time with a missing module, pointing at the app
 * rather than at the workspace.
 *
 * `extraNodeModules` is the other half, and it is about runtime rather than
 * resolution: a package manager can materialise a second copy of a native module
 * under the app, and two registrations of one native module break. This is the
 * block `apps/playground/metro.config.js` in this repository carries for exactly
 * this reason.
 */
export function monorepoResolverBlock(appRoot: string, workspaceRoot: string): string {
	const pins = PINNED_MODULES.map(
		(name) => `\t${JSON.stringify(name)}: path.resolve(workspaceRoot, "node_modules/${name}"),`
	).join("\n");

	return `const path = require("node:path");

const workspaceRoot = path.resolve(__dirname, "${toSpecifier(appRoot, workspaceRoot)}");

// The components live in a package outside this app, so Metro has to watch and
// resolve beyond the app's own directory.
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
\tpath.resolve(__dirname, "node_modules"),
\tpath.resolve(workspaceRoot, "node_modules"),
];
config.resolver.disableHierarchicalLookup = true;

// One copy of each native module for the whole bundle: two registrations of a
// native module break at runtime.
config.resolver.extraNodeModules = {
${pins}
};
`;
}

function template(wrapper: string, monorepo: string): string {
	return `const { getDefaultConfig } = require("expo/metro-config");
${REQUIRE}

const config = getDefaultConfig(__dirname);
${monorepo ? `\n${monorepo}` : ""}
// withUniwindConfig must stay the outermost wrapper.
module.exports = withUniwindConfig(config, ${wrapper});
`;
}

function manualSnippet(wrapper: string, isEsm: boolean): string {
	const keyword = isEsm ? "export default" : "module.exports =";
	return `${isEsm ? IMPORT : REQUIRE}\n\n// Keep this the outermost wrapper.\n${keyword} withUniwindConfig(config, ${wrapper});`;
}

function toSpecifier(from: string, target: string): string {
	const path = toPosix(relative(from, target));
	return path.startsWith(".") ? path : `./${path}`;
}

function toPosix(path: string): string {
	return sep === "/" ? path : path.split(sep).join("/");
}
