import { mkdir, readdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { type Reporter, run, type Workspace } from "./harness";
export type ConsumerOptions = { consumer: boolean; install: boolean; layout: "standalone" | "monorepo" };

export function parseConsumerOptions(argv: string[]): ConsumerOptions {
	const consumer = argv.includes("--consumer");
	const install = !argv.includes("--no-install");
	const layoutIndex = argv.indexOf("--layout");
	const layout =
		argv.includes("--monorepo") || (layoutIndex >= 0 && argv[layoutIndex + 1] === "monorepo")
			? "monorepo"
			: "standalone";
	if (consumer && !install) throw new Error("--consumer requires installation; remove --no-install");
	if (consumer && argv.includes("--tests")) throw new Error("--consumer does not run copied tests; remove --tests");
	if (consumer && argv.includes("--only")) {
		throw new Error("--consumer selects its own Button, Input, Chart and BottomSheet cases; remove --only");
	}
	if (consumer && argv.includes("--simulator")) {
		throw new Error("--consumer does not run simulator acceptance; remove --simulator");
	}
	return { consumer, install, layout };
}

export const UI_PACKAGE = "@delacour/react-native-ui";
export const UI_WORKSPACE_PATH = "../../../react-native-ui";
export const ENGINE_CASES = ["@delacour/react-native-charts", "@delacour/react-native-bottom-sheet"] as const;
export const OPTIONAL_ENGINE_PACKAGES = [...ENGINE_CASES, "react-native-skia", "react-native-teleport"] as const;

/** Resolve optional engines from the app, rather than trusting its manifest. */
export async function resolveOptionalEngines(appRoot: string): Promise<string[]> {
	const require = createRequire(join(appRoot, "package.json"));
	const resolved: string[] = [];
	for (const name of OPTIONAL_ENGINE_PACKAGES) {
		try {
			resolved.push(`${name} at ${await realpath(require.resolve(name))}`);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === "MODULE_NOT_FOUND") continue;
			throw new Error(`Could not check optional engine ${name}: ${String(error)}`);
		}
	}
	return resolved;
}

/** Fail when any installed app dependency or public import resolves into this checkout. */
export async function assertNoCheckoutFallback(
	appRoot: string,
	checkoutRoot: string,
	packageJson: {
		dependencies?: Record<string, string>;
		devDependencies?: Record<string, string>;
		optionalDependencies?: Record<string, string>;
	}
): Promise<void> {
	const require = createRequire(join(appRoot, "package.json"));
	const checkout = await realpath(checkoutRoot);
	const names = new Set([
		...Object.keys(packageJson.dependencies ?? {}),
		...Object.keys(packageJson.devDependencies ?? {}),
		...Object.keys(packageJson.optionalDependencies ?? {}),
		`${UI_PACKAGE}/button`,
		`${UI_PACKAGE}/input`,
		`${UI_PACKAGE}/chart`,
		`${UI_PACKAGE}/bottom-sheet`,
		...ENGINE_CASES,
	]);
	for (const name of names) {
		try {
			let resolved: string;
			try {
				resolved = require.resolve(`${name}/package.json`);
			} catch {
				resolved = require.resolve(name);
			}
			const entry = await realpath(resolved);
			const fromCheckout = relative(checkout, entry);
			if (fromCheckout === "" || (!fromCheckout.startsWith(`..${sep}`) && !isAbsolute(fromCheckout))) {
				throw new Error(`${name} resolves from the checkout at ${entry}`);
			}
		} catch (error) {
			if (error instanceof Error && error.message.includes("resolves from the checkout")) throw error;
			const code = (error as NodeJS.ErrnoException).code;
			// Packages with only subpath exports have no root entry. Metro checks the imported subpaths.
			if (code === "MODULE_NOT_FOUND" || code === "ERR_PACKAGE_PATH_NOT_EXPORTED") continue;
			throw new Error(`Could not check consumer package ${name}: ${String(error)}`);
		}
	}
}

export function isPathInside(root: string, path: string): boolean {
	const relativePath = relative(resolve(root), resolve(path));
	return relativePath === "" || (!relativePath.startsWith(`..${sep}`) && !isAbsolute(relativePath));
}

/** Scan the installed package's real source path, as the npm installation guide requires. */
export async function writeConsumerStyles(appRoot: string, cssPath: string): Promise<void> {
	const require = createRequire(join(appRoot, "package.json"));
	const entry = await realpath(require.resolve(`${UI_PACKAGE}/button`));
	const source = resolve(dirname(entry), "../..");
	const from = dirname(cssPath);
	const libraryPath = relative(from, source).split(sep).join("/");
	const appPath = relative(from, join(appRoot, "src")).split(sep).join("/") || ".";
	await mkdir(from, { recursive: true });
	await writeFile(
		cssPath,
		`@import "tailwindcss";\n@import "uniwind";\n@import "${UI_PACKAGE}/styles";\n@source "${libraryPath}";\n@source "${appPath}";\n`,
		"utf-8"
	);
}

export function validateConsumerTarball(
	manifest: { name?: string; exports?: Record<string, string>; files?: string[] },
	files: string[],
	sourceEntries: Record<string, string>
): string[] {
	const problems: string[] = [];
	if (manifest.name !== UI_PACKAGE) problems.push(`package name is ${manifest.name ?? "missing"}`);
	if (!manifest.files?.includes("src")) problems.push("package files does not include src");
	for (const specifier of ["./button", "./input", "./chart", "./bottom-sheet"]) {
		if (!manifest.exports?.[specifier]) problems.push(`package exports does not include ${specifier}`);
	}

	for (const [specifier, target] of Object.entries(manifest.exports ?? {})) {
		const path = `package/${target.replace(/^\.\//, "")}`;
		if (!files.includes(path)) problems.push(`${specifier} points to missing tarball file ${path}`);
	}

	for (const entry of ["package/src/components/button/index.ts", "package/src/components/input/index.ts"]) {
		if (!files.includes(entry)) problems.push(`missing exported source ${entry}`);
	}
	for (const [entry, content] of Object.entries(sourceEntries)) {
		if (/(?:from\s*|import\s*(?:\(\s*)?)["'](?:@\/|@registry\/|workspace:)/u.test(content)) {
			problems.push(`${entry} contains a workspace-only import`);
		}
	}
	return problems;
}

/** Pack and inspect the published UI package before a consumer installs it. */
export async function installUiTarball(workspace: Workspace, destination: string, reporter: Reporter): Promise<void> {
	const packageDir = join(import.meta.dirname, UI_WORKSPACE_PATH);
	const manifest = (await Bun.file(join(packageDir, "package.json")).json()) as {
		version: string;
		name: string;
	};
	const tarball = `${manifest.name.replace(/^@/, "").replace("/", "-")}-${manifest.version}.tgz`;
	await mkdir(destination, { recursive: true });
	await rm(join(destination, tarball), { force: true });
	await run("bun", ["pm", "pack", "--destination", destination], {
		cwd: packageDir,
		reporter,
		label: `bun pm pack ${manifest.name}`,
	});

	const archive = join(destination, tarball);
	const unpacked = join(destination, "ui-unpacked");
	await rm(unpacked, { recursive: true, force: true });
	await mkdir(unpacked, { recursive: true });
	await run("tar", ["-xzf", archive, "-C", unpacked], {
		cwd: destination,
		reporter,
		label: `inspect ${manifest.name} tarball`,
	});

	const root = join(unpacked, "package");
	const packedManifest = JSON.parse(await readFile(join(root, "package.json"), "utf-8")) as {
		name?: string;
		exports?: Record<string, string>;
		files?: string[];
	};
	const paths = await readdir(root, { recursive: true, withFileTypes: true });
	const packedFiles = paths
		.filter((entry) => entry.isFile())
		.map((entry) => `package/${relative(root, join(entry.parentPath, entry.name)).split(sep).join("/")}`);
	const sourceEntries: Record<string, string> = {};
	for (const entry of paths.filter((candidate) => entryIsTypeScript(candidate))) {
		const path = relative(root, join(entry.parentPath, entry.name)).split(sep).join("/");
		sourceEntries[`package/${path}`] = await readFile(join(root, path), "utf-8");
	}
	const problems = validateConsumerTarball(packedManifest, packedFiles, sourceEntries);
	if (problems.length > 0) throw new Error(`UI package tarball is not consumer-ready:\n  ${problems.join("\n  ")}`);

	await run("bun", ["add", archive], {
		cwd: workspace.appRoot,
		reporter,
		label: `bun add ${manifest.name} tarball`,
	});
	reporter.pass(`${manifest.name} exports and source verified from ${tarball}`);
}

function entryIsTypeScript(entry: { isFile(): boolean; name: string }): boolean {
	return entry.isFile() && /\.tsx?$/u.test(entry.name);
}
