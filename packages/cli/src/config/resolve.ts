import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import type { Namespace } from "../registry/namespaces";
import { CONFIG_FILENAME, type Config, configSchema } from "./schema";

/**
 * Finds and loads the `native-components.json` that governs a directory.
 *
 * The nearest one wins, walking upwards. That is the whole of the monorepo
 * story: a shared UI package holds its own config, an app that keeps components
 * locally holds one of its own, and running the CLI from anywhere inside either
 * finds the right one without a `--workspace` flag to get wrong.
 *
 * The walk stops at the repository root. Past it lie a developer's other
 * projects, and silently adopting a config from `~/code` would write components
 * into someone else's app.
 */

export type ResolvedConfig = Config & {
	/** Absolute path to the directory holding `native-components.json`. */
	root: string;
	configPath: string;
	/** Absolute destination directory per namespace. */
	directories: Record<Namespace, string>;
	app: Config["app"] & {
		/** Absolute paths to the Expo app's own files. */
		resolved: { root: string; css: string; metroConfig: string; uniwindTypes: string };
	};
};

/** Walks up from `cwd` looking for a config. Returns its path, or `null`. */
export function findConfig(cwd: string): string | null {
	let directory = resolve(cwd);

	while (true) {
		const candidate = join(directory, CONFIG_FILENAME);
		if (existsSync(candidate)) return candidate;

		// Checked this directory already; a `.git` here means it was the last one worth checking.
		if (existsSync(join(directory, ".git"))) return null;

		const parent = dirname(directory);
		if (parent === directory) return null;
		directory = parent;
	}
}

export class MissingConfigError extends Error {
	constructor(cwd: string) {
		super(`No ${CONFIG_FILENAME} found in ${cwd} or any parent directory. Run \`delacour init\` first.`);
		this.name = "MissingConfigError";
	}
}

export async function loadConfig(cwd: string): Promise<ResolvedConfig> {
	const configPath = findConfig(cwd);
	if (!configPath) throw new MissingConfigError(cwd);

	return readConfig(configPath);
}

export async function readConfig(configPath: string): Promise<ResolvedConfig> {
	const raw = await readFile(configPath, "utf-8");

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch (error) {
		throw new Error(`${configPath} is not valid JSON: ${(error as Error).message}`);
	}

	const result = configSchema.safeParse(parsed);
	if (!result.success) {
		const issues = result.error.issues.map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`);
		throw new Error(`${configPath} is not a valid config:\n${issues.join("\n")}`);
	}

	return resolveConfig(result.data, dirname(configPath), configPath);
}

export function resolveConfig(config: Config, root: string, configPath: string): ResolvedConfig {
	const appRoot = absolute(root, config.app.root);

	return {
		...config,
		root,
		configPath,
		directories: {
			ui: absolute(root, config.paths.ui),
			lib: absolute(root, config.paths.lib),
			hooks: absolute(root, config.paths.hooks),
			styles: absolute(root, config.paths.styles),
			icons: absolute(root, config.paths.icons),
		},
		app: {
			...config.app,
			resolved: {
				root: appRoot,
				css: absolute(appRoot, config.app.css),
				metroConfig: absolute(appRoot, config.app.metroConfig),
				uniwindTypes: absolute(appRoot, config.app.uniwindTypes),
			},
		},
	};
}

function absolute(from: string, path: string): string {
	return isAbsolute(path) ? path : resolve(from, path);
}
