import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { basename, dirname, join, relative, resolve } from "node:path";
import * as clack from "@clack/prompts";
import { x } from "tinyexec";
import { loadConfig, type ResolvedConfig } from "../config/resolve";
import { CONFIG_FILENAME } from "../config/schema";
import { isCovered, parseSources } from "../project/css";
import { detectProject, majorOf, type ProjectInfo } from "../project/detect";
import { UNIWIND_ENV_FILENAME, UNIWIND_ENV_REFERENCE } from "../project/uniwind-env";
import { NAMESPACES } from "../registry/namespaces";
import { createOutput, type Output, style } from "../ui/output";

/**
 * Checks the wiring that decides whether copied components actually work.
 *
 * shadcn has no equivalent because the web has no equivalent failure modes.
 * Every check here is a way an Expo app can be misconfigured such that nothing
 * errors and nothing works: a `@source` that misses the components and strips
 * their classes from a release build, a Metro wrapper applied in the wrong
 * order, path aliases Metro was never told to resolve, a native module in
 * `package.json` that is not in the binary yet.
 *
 * Each check reports what to do about it. None of them mutate anything.
 */

export type DoctorOptions = {
	cwd: string;
	silent?: boolean;
	json?: boolean;
	/** Skip the checks that shell out to the Expo CLI. */
	fast?: boolean;
};

export type CheckStatus = "pass" | "warn" | "fail" | "skip";

export type Check = {
	name: string;
	status: CheckStatus;
	detail: string;
	fix?: string;
};

export async function doctor(options: DoctorOptions): Promise<number> {
	const output = createOutput(options);
	const checks = await runChecks(options);

	if (options.json) {
		process.stdout.write(`${JSON.stringify(checks, null, 2)}\n`);
		return checks.some((check) => check.status === "fail") ? 1 : 0;
	}

	return summarise(checks, output);
}

/** The checks themselves, printing nothing — this is what the MCP server calls. */
export async function runChecks(options: DoctorOptions): Promise<Check[]> {
	const config = await loadConfig(options.cwd);
	const project = await detectProject(config.app.resolved.root);
	const expoConfig = options.fast ? null : await readExpoConfig(config.app.resolved.root);

	return [
		checkFramework(project),
		checkNewArchitecture(expoConfig, project),
		checkUniwindInstalled(project),
		await checkMetro(config),
		await checkTailwindSources(config),
		checkTsconfigPaths(config, expoConfig),
		checkUniwindTypes(config),
		await checkThemeTokens(config),
		await checkCssEntryImported(config),
		await checkGestureHandlerRoot(config),
		await checkDuplicateNativeModules(project),
	];
}

/** Prints the checks and turns them into an exit code. */
function summarise(checks: readonly Check[], output: Output): number {
	if (!output.silent) clack.log.message(checks.map(render).join("\n"));

	const failed = checks.filter((check) => check.status === "fail").length;
	const warned = checks.filter((check) => check.status === "warn").length;

	if (failed > 0) output.error(`${failed} check${failed === 1 ? "" : "s"} failed.`);
	else if (warned > 0) output.warn(`${warned} thing${warned === 1 ? "" : "s"} to look at.`);
	else output.success("Everything checks out.");

	return failed > 0 ? 1 : 0;
}

const ICONS: Record<CheckStatus, string> = {
	pass: style.green("✓"),
	warn: style.yellow("!"),
	fail: style.red("✗"),
	skip: style.dim("–"),
};

function render(check: Check): string {
	const head = `${ICONS[check.status]} ${check.name}  ${style.dim(check.detail)}`;
	return check.fix ? `${head}\n    ${style.dim("→")} ${check.fix}` : head;
}

function checkFramework(project: ProjectInfo): Check {
	if (!project.expoVersion) {
		return {
			name: "Expo",
			status: "warn",
			detail: "no expo dependency found",
			fix: "These components target Expo. On bare React Native, install the native modules yourself.",
		};
	}

	return {
		name: "Expo",
		status: "pass",
		detail: `SDK ${project.expoVersion}, react-native ${project.reactNativeVersion}`,
	};
}

/**
 * Reanimated 4 is New Architecture only.
 *
 * On the old architecture it fails at build or at the first worklet, and every
 * pressable in the library runs one.
 */
function checkNewArchitecture(expoConfig: ExpoConfig | null, project: ProjectInfo): Check {
	if (!expoConfig) return { name: "New Architecture", status: "skip", detail: "expo config not read (--fast)" };

	const enabled = expoConfig.newArchEnabled !== false;
	const sdk = majorOf(project.expoVersion);

	// Default-on from SDK 52; before that it has to be asked for.
	if (enabled && (sdk === null || sdk >= 52)) {
		return { name: "New Architecture", status: "pass", detail: "enabled" };
	}

	return {
		name: "New Architecture",
		status: "fail",
		detail: "disabled",
		fix: 'Set "newArchEnabled": true — Reanimated 4 does not run without it.',
	};
}

function checkUniwindInstalled(project: ProjectInfo): Check {
	if (project.hasUniwind && project.hasTailwind) {
		return { name: "Uniwind", status: "pass", detail: "uniwind and tailwindcss installed" };
	}

	const missing = [!project.hasUniwind && "uniwind", !project.hasTailwind && "tailwindcss"].filter(Boolean);
	return {
		name: "Uniwind",
		status: "fail",
		detail: `missing ${missing.join(", ")}`,
		fix: `npx expo install ${missing.join(" ")}`,
	};
}

/**
 * `withUniwindConfig` installs the transformer that compiles `className`. A
 * wrapper applied after it can replace `config.transformer` and leave every
 * component unstyled with nothing logged, so its position matters as much as
 * its presence.
 */
async function checkMetro(config: ResolvedConfig): Promise<Check> {
	const content = await read(config.app.resolved.metroConfig);
	if (content === null) {
		return { name: "Metro", status: "fail", detail: "metro.config.js not found", fix: "Run `delacour init`." };
	}

	if (!content.includes("withUniwindConfig")) {
		return {
			name: "Metro",
			status: "fail",
			detail: "not wrapped with withUniwindConfig",
			fix: "Run `delacour init` again, or wrap the export yourself.",
		};
	}

	const exported = /(?:module\.exports\s*=|export default)\s*([\s\S]*)$/.exec(content)?.[1] ?? "";
	if (!exported.trimStart().startsWith("withUniwindConfig")) {
		return {
			name: "Metro",
			status: "fail",
			detail: "withUniwindConfig is not the outermost wrapper",
			fix: "Another wrapper runs after it and can replace the transformer. Make it the last one applied.",
		};
	}

	const expected = relative(config.app.resolved.root, config.app.resolved.css);
	if (!content.includes(expected.replace(/\\/g, "/"))) {
		return {
			name: "Metro",
			status: "warn",
			detail: "cssEntryFile does not point at the configured entry",
			fix: `${CONFIG_FILENAME} says app.css is ${expected}.`,
		};
	}

	return { name: "Metro", status: "pass", detail: "wrapped, outermost, pointing at the configured entry" };
}

/**
 * The check that catches the worst failure mode in the whole tool.
 *
 * Tailwind compiles the classes it finds in source text. A `@source` that does
 * not reach the components produces a build with no error and no styles — and
 * in a monorepo the natural glob points at the `node_modules` symlink, which
 * Tailwind's scanner does not follow.
 */
async function checkTailwindSources(config: ResolvedConfig): Promise<Check> {
	const content = await read(config.app.resolved.css);
	if (content === null) {
		return { name: "Tailwind sources", status: "fail", detail: "no CSS entry found", fix: "Run `delacour init`." };
	}

	const sources = parseSources(content, config.app.resolved.css);
	const uncovered = NAMESPACES.filter(
		(namespace) =>
			namespace !== "styles" &&
			existsSync(config.directories[namespace]) &&
			!isCovered(config.directories[namespace], sources)
	);

	if (uncovered.length > 0) {
		return {
			name: "Tailwind sources",
			status: "fail",
			detail: `not scanned: ${uncovered.map((namespace) => config.paths[namespace]).join(", ")}`,
			fix: "Classes in those files are dropped from release builds. Run `delacour init` to rewrite the @source block.",
		};
	}

	return { name: "Tailwind sources", status: "pass", detail: `${sources.length} source path(s) cover every component` };
}

/** Metro resolves `tsconfig` paths only with the experiment on. */
function checkTsconfigPaths(config: ResolvedConfig, expoConfig: ExpoConfig | null): Check {
	const usesAliases = Object.keys(config.aliases).length > 0;

	if (!usesAliases) {
		return { name: "Path aliases", status: "pass", detail: "not used — components import each other relatively" };
	}

	if (!expoConfig) return { name: "Path aliases", status: "skip", detail: "expo config not read (--fast)" };

	if (expoConfig.experiments?.tsconfigPaths) {
		return { name: "Path aliases", status: "pass", detail: "tsconfigPaths enabled" };
	}

	return {
		name: "Path aliases",
		status: "fail",
		detail: "aliases configured but experiments.tsconfigPaths is off",
		fix: 'Set experiments: { tsconfigPaths: true } in app.config — Metro cannot resolve "@/…" without it.',
	};
}

/**
 * The augmentation has to be loadable **by the app**, not merely present.
 *
 * Checking only the styles directory passes in a shared package while the app
 * remains unaugmented: the file sits outside the app's `tsconfig` `include` and
 * nothing imports it, so it never joins the program. The symptom is a type error
 * on every `className` that names neither the file nor the cause — which is
 * exactly what this check existed to prevent, in the one layout it was blind to.
 */
function checkUniwindTypes(config: ResolvedConfig): Check {
	const beside = join(config.directories.styles, UNIWIND_ENV_FILENAME);

	if (!existsSync(beside)) {
		return {
			name: "Uniwind types",
			status: "warn",
			detail: `${UNIWIND_ENV_FILENAME} not found`,
			fix: "Run `delacour add styles` — without it, className is a type error on React Native components.",
		};
	}

	// Only a concern when the components live somewhere the app does not compile.
	if (config.package && !appLoadsUniwindEnv(config)) {
		return {
			name: "Uniwind types",
			status: "fail",
			detail: `the app cannot load ${UNIWIND_ENV_FILENAME} from the package`,
			fix: `Add a ${UNIWIND_ENV_FILENAME} containing \`${UNIWIND_ENV_REFERENCE}\` to the app — the copy in the package is outside its tsconfig include, so className stays a type error.`,
		};
	}

	return { name: "Uniwind types", status: "pass", detail: `${UNIWIND_ENV_FILENAME} present` };
}

/**
 * Every token `theme.css` declares is reachable as a utility.
 *
 * The palette is two layers — raw names under `@variant light` / `@variant
 * dark`, and an `@theme inline` block mapping each onto `--color-*`. A name
 * added to the first and forgotten in the second is declared but unreachable:
 * no `bg-*` exists for it, Tailwind says nothing, and the class silently draws
 * nothing. The reverse is worse — a variant that declares a name the other does
 * not makes Uniwind refuse to build at all.
 */
async function checkThemeTokens(config: ResolvedConfig): Promise<Check> {
	const path = join(config.directories.styles, "theme.css");
	if (!existsSync(path)) {
		return {
			name: "Theme tokens",
			status: "warn",
			detail: "theme.css not found",
			fix: "Run `delacour add styles`, or `delacour theme <source>` to bring one across from a web app.",
		};
	}

	const css = await readFile(path, "utf-8");
	const light = variantTokens(css, "light");
	const dark = variantTokens(css, "dark");

	const lopsided = [...light, ...dark].filter((token) => !light.has(token) || !dark.has(token));
	if (lopsided.length > 0) {
		return {
			name: "Theme tokens",
			status: "fail",
			detail: `${[...new Set(lopsided)].join(", ")} declared in one theme only`,
			fix: "Declare it in both — Uniwind refuses to build a theme missing a variable the other one has.",
		};
	}

	// Scoped to the alias block on purpose. A derived token like
	// `--elevated: var(--background)` inside a variant looks identical to an
	// alias, and counting it would pass a token that has no utility at all.
	const aliasBlock = css.slice(css.indexOf("@theme inline {"));
	const aliased = new Set([...aliasBlock.matchAll(/^\s*--(?:color-)?([\w-]+):\s*var\(/gm)].map(([, name]) => name));
	const unreachable = [...light].filter((token) => !aliased.has(token) && token !== "shadow");

	if (unreachable.length > 0) {
		return {
			name: "Theme tokens",
			status: "warn",
			detail: `${unreachable.join(", ")} declared but not aliased`,
			fix: "Add `--color-<name>: var(--<name>);` to the `@theme inline` block — without it no `bg-*` exists for the token.",
		};
	}

	return { name: "Theme tokens", status: "pass", detail: `${light.size} tokens, aliased in both themes` };
}

/** Token names declared inside one `@variant` block, brace-matched. */
function variantTokens(css: string, variant: "dark" | "light"): Set<string> {
	const marker = `@variant ${variant} {`;
	const start = css.indexOf(marker);
	if (start === -1) return new Set();

	let depth = 1;
	let index = start + marker.length;

	while (index < css.length && depth > 0) {
		if (css[index] === "{") depth += 1;
		if (css[index] === "}") depth -= 1;
		index += 1;
	}

	const block = css.slice(start + marker.length, index - 1);

	return new Set([...block.matchAll(/^\s*--([\w-]+):/gm)].map(([, name]) => name));
}

/** Anywhere inside the app's own tree will do; `tsconfig` includes it from there. */
function appLoadsUniwindEnv(config: ResolvedConfig): boolean {
	const root = config.app.resolved.root;

	return [
		join(root, UNIWIND_ENV_FILENAME),
		join(root, "src", UNIWIND_ENV_FILENAME),
		join(root, "types", UNIWIND_ENV_FILENAME),
	].some((candidate) => existsSync(candidate));
}

/**
 * The Tailwind entry has to be imported by the app, not merely named in
 * `metro.config.js`.
 *
 * `withUniwindConfig`'s `cssEntryFile` tells the transformer which file to
 * compile; it does not put that file in the bundle. If nothing imports it, the
 * app builds, boots and renders every component **completely unstyled** — no
 * padding, no colours, spinners drawn at their natural SVG size. Nothing is
 * logged, and the components themselves are fine, so the search starts in
 * exactly the wrong place.
 *
 * Found by booting a scaffolded app on a simulator, which is the only stage
 * that could have found it.
 */
async function checkCssEntryImported(config: ResolvedConfig): Promise<Check> {
	const entry = config.app.resolved.css;
	const importers = await filesImporting(config.app.resolved.root, entry);

	if (importers.length > 0) {
		return {
			name: "CSS entry",
			status: "pass",
			detail: `imported by ${relative(config.app.resolved.root, importers[0] as string)}`,
		};
	}

	return {
		name: "CSS entry",
		status: "fail",
		detail: `nothing imports ${config.app.css}`,
		fix: `Add \`import "${importSpecifierFor(config)}";\` as the first statement of your root layout — without it every component renders unstyled.`,
	};
}

/** The specifier a root layout would use, preferring the alias when there is one. */
function importSpecifierFor(config: ResolvedConfig): string {
	const alias = config.aliases.styles;
	if (alias) return `${alias.replace(/\/+$/, "")}/${basename(config.app.resolved.css)}`;
	return `./${basename(config.app.resolved.css)}`;
}

/**
 * Source files that import `target`, resolved rather than string-matched — a
 * project may reach its entry by alias, by relative path, or from a directory
 * two levels up.
 */
async function filesImporting(root: string, target: string): Promise<string[]> {
	let entries: string[];
	try {
		entries = await readdir(root, { recursive: true });
	} catch {
		return [];
	}

	const found: string[] = [];

	for (const entry of entries) {
		if (!/\.tsx?$/.test(entry) || entry.includes("node_modules")) continue;

		const path = join(root, entry);
		const content = await read(path);
		if (content && cssImportsIn(content, path).some((imported) => matchesEntry(imported, target))) found.push(path);
	}

	return found;
}

/**
 * Side-effect CSS imports in a file, resolved where they are relative.
 *
 * Comment lines are skipped, and that is load-bearing rather than defensive:
 * the copied `provider.tsx` carries `import "../styles/global.css";` inside a
 * doc comment, which would otherwise satisfy the very check this exists for.
 */
function cssImportsIn(content: string, path: string): string[] {
	const imports: string[] = [];

	for (const line of content.split("\n")) {
		const trimmed = line.trimStart();
		if (trimmed.startsWith("*") || trimmed.startsWith("//") || trimmed.startsWith("/*")) continue;

		const specifier = /^import\s+["']([^"']+\.css)["']/.exec(trimmed)?.[1];
		if (specifier) imports.push(specifier.startsWith(".") ? resolve(dirname(path), specifier) : specifier);
	}

	return imports;
}

/** An alias import cannot be resolved without the alias map, so fall back to the filename. */
function matchesEntry(imported: string, target: string): boolean {
	return imported === target || (!imported.startsWith("/") && basename(imported) === basename(target));
}

/**
 * Every pressable in the library is a Gesture Handler detector, and a detector
 * outside a `GestureHandlerRootView` never receives a touch. Nothing throws;
 * the button simply does not respond.
 */
async function checkGestureHandlerRoot(config: ResolvedConfig): Promise<Check> {
	const roots = ["src/app", "app", "src"].map((path) => join(config.app.resolved.root, path));
	const found = await Promise.all(roots.map((root) => containsText(root, "GestureHandlerRootView")));

	if (found.some(Boolean)) {
		return { name: "Gesture Handler", status: "pass", detail: "GestureHandlerRootView found at the app root" };
	}

	return {
		name: "Gesture Handler",
		status: "warn",
		detail: "no GestureHandlerRootView found",
		fix: "Wrap your root layout in <GestureHandlerRootView style={{ flex: 1 }}> — presses do nothing without it.",
	};
}

/**
 * Two copies of a native module register twice and break at runtime.
 *
 * A monorepo invites this: the package manager can materialise a second copy
 * under the app while the workspace root holds another. `apps/playground`'s
 * `extraNodeModules` block in this repository exists for exactly this.
 */
async function checkDuplicateNativeModules(project: ProjectInfo): Promise<Check> {
	if (!project.workspaceRoot || !project.appRoot || project.workspaceRoot === project.appRoot) {
		return { name: "Native modules", status: "pass", detail: "single package, nothing to duplicate" };
	}

	const watched = [
		"@shopify/react-native-skia",
		"react-native",
		"react-native-reanimated",
		"react-native-gesture-handler",
		"react-native-svg",
	];
	const duplicated = watched.filter(
		(name) =>
			existsSync(join(project.appRoot as string, "node_modules", name)) &&
			existsSync(join(project.workspaceRoot as string, "node_modules", name))
	);

	if (duplicated.length === 0) {
		return { name: "Native modules", status: "pass", detail: "one copy of each" };
	}

	return {
		name: "Native modules",
		status: "warn",
		detail: `two copies of ${duplicated.join(", ")}`,
		fix: [
			"Pin them in metro.config resolver.extraNodeModules — two registrations of a native module break at runtime.",
			"tsc does not read that, so pin them in tsconfig `paths` too, or Uniwind's className augmentation misses the",
			"nested copy and every Animated component reports a type error naming neither cause.",
		].join(" "),
	};
}

type ExpoConfig = {
	newArchEnabled?: boolean;
	experiments?: { tsconfigPaths?: boolean };
};

/** `app.config.ts` is code, so the Expo CLI is the only thing that can read it. */
async function readExpoConfig(cwd: string): Promise<ExpoConfig | null> {
	try {
		const result = await x("npx", ["expo", "config", "--json", "--type", "public"], {
			nodeOptions: { cwd },
			throwOnError: false,
			timeout: 60_000,
		});

		if (result.exitCode !== 0) return null;
		return JSON.parse(result.stdout) as ExpoConfig;
	} catch {
		return null;
	}
}

async function containsText(directory: string, needle: string): Promise<boolean> {
	let entries: string[];
	try {
		entries = await readdir(directory, { recursive: true });
	} catch {
		return false;
	}

	for (const entry of entries) {
		if (!/\.tsx?$/.test(entry)) continue;
		const content = await read(join(directory, entry));
		if (content?.includes(needle)) return true;
	}

	return false;
}

async function read(path: string): Promise<string | null> {
	try {
		return await readFile(path, "utf-8");
	} catch {
		return null;
	}
}
