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

export type MetroPatchOptions = {
	/** Absolute path to `metro.config.js`. */
	metroConfigPath: string;
	/** Absolute path to the Tailwind entry. */
	cssPath: string;
	/** Absolute path to the generated `className` types. */
	typesPath: string;
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

	if (existing === null) return { status: "created", content: template(wrapper) };
	if (existing.includes("withUniwindConfig")) return { status: "already-wired" };

	const isEsm = /^\s*(import|export default)/m.test(existing);
	const pattern = isEsm ? ESM_EXPORT : COMMONJS_EXPORT;
	const match = pattern.exec(existing);

	if (!match?.[1]) return { status: "manual", snippet: manualSnippet(wrapper, isEsm) };

	const keyword = isEsm ? "export default" : "module.exports =";
	const head = existing.slice(0, match.index);
	const wrapped = `${keyword} withUniwindConfig(${match[1].trim()}, ${wrapper});\n`;

	return { status: "patched", content: `${isEsm ? IMPORT : REQUIRE}\n${head}${wrapped}` };
}

function optionsLiteral(options: MetroPatchOptions): string {
	const from = dirname(options.metroConfigPath);
	return `{\n\tcssEntryFile: "${toSpecifier(from, options.cssPath)}",\n\tdtsFile: "${toSpecifier(from, options.typesPath)}",\n}`;
}

function template(wrapper: string): string {
	return `const { getDefaultConfig } = require("expo/metro-config");
${REQUIRE}

const config = getDefaultConfig(__dirname);

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
