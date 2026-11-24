import { DEFAULT_REGISTRY_URL, type RegistrySource, resolveRegistrySource } from "../registry/source";

/**
 * The pure half of the CLI's telemetry: what one `command` event says, worked
 * out from a commander command and nothing else.
 *
 * Every function here is a filter. What may leave the machine is decided in
 * this file, and `docs/native/cli#telemetry` and `/privacy` describe exactly
 * what these return — so a new property is a change here, in those two pages,
 * and in their tests together. Flag **values**, paths, free text and error
 * messages have no way through: a function that returned them would have to be
 * written, and reviewed, on purpose.
 */

export type RegistryKind = "official" | "custom" | "local";

/**
 * Every property a `command` event carries — the whole of it, since `tracker.ts` builds the
 * event as this type and nothing else.
 */
export type CommandProperties = {
	command: string;
	flags: string[];
	registry: RegistryKind;
	components?: string[];
	packageManager?: string;
	expoSdk?: number;
	errorKind?: string;
	exitCode?: number;
};

/**
 * The words `/privacy` uses for each property. A `Record` over `keyof CommandProperties`, so adding a
 * property without saying what to call it is a type error, and `apps/web/src/lib/privacy.test.ts`
 * requires each phrase to appear in the policy — a property cannot ship undisclosed.
 */
export const PROPERTY_DISCLOSURE: Record<keyof CommandProperties, string> = {
	command: "its name",
	flags: "names, never the values, of the flags",
	registry: "whether the registry is ours, your own or a local folder",
	components: "component names",
	packageManager: "package manager",
	expoSdk: "Expo SDK version",
	errorKind: "class name of any error",
	exitCode: "its exit code",
};

/** A registry item name: lowercase, digits and hyphens. Nothing a path or a URL could be. */
const COMPONENT_NAME = /^[a-z0-9-]{1,40}$/;
export const MAX_COMPONENTS = 50;

/** The commands whose positional arguments are registry item names. */
const COMPONENT_COMMANDS: ReadonlySet<string> = new Set(["add", "update", "view", "diff", "init"]);

/** The part of a commander `Option` this file reads. */
type OptionLike = { long?: string; negate: boolean; attributeName(): string };

/** The part of a commander `Command` this file reads, so a test needs no program. */
export type CommandLike = {
	options: readonly OptionLike[];
	getOptionValueSource(key: string): string | undefined;
	getOptionValue(key: string): unknown;
};

/**
 * The long names of the flags typed on the command line — `--yes`, `--no-install` — and never
 * their values. A default, an environment variable and a config file are not "typed", so
 * `getOptionValueSource` has to say `cli`.
 *
 * `--install` and `--no-install` are one attribute, and the value says which was typed: a
 * negated option was typed when the value is `false`, its positive twin when it is not.
 */
export function flagsSetOnCli(command: CommandLike): string[] {
	const flags = command.options.flatMap((option) => {
		if (!option.long) return [];

		const key = option.attributeName();
		if (command.getOptionValueSource(key) !== "cli") return [];

		const value = command.getOptionValue(key);

		return (option.negate ? value === false : value !== false) ? [option.long] : [];
	});

	return flags.sort();
}

export function classifyRegistry(source: RegistrySource): RegistryKind {
	if (source.kind === "local") return "local";

	// The trailing slash keeps `delacour-ui-fork` from passing for `delacour-ui`.
	return source.base.startsWith(`${DEFAULT_REGISTRY_URL}/`) ? "official" : "custom";
}

export type RegistryKindInput = {
	cwd: string;
	/** `--registry`. */
	registry?: string;
	ref?: string;
	/** `registry.url` from the project's `native-components.json`. */
	configRegistry?: string;
	env?: Record<string, string | undefined>;
};

/** Which registry this run reads, resolved the way the commands resolve it. */
export function registryKindFor(input: RegistryKindInput): RegistryKind {
	return classifyRegistry(
		resolveRegistrySource({
			cwd: input.cwd,
			url: input.registry || input.configRegistry,
			ref: input.ref,
			env: input.env,
		})
	);
}

/**
 * The component names a run was asked for, or `null` for none.
 *
 * Only from the official registry — a fork's item names can be a client's — and only names
 * shaped like one. `search`'s query and `theme`'s source are free text and never come here.
 */
export function componentsFor(command: string, args: readonly string[], registry: RegistryKind): string[] | null {
	if (registry !== "official" || !COMPONENT_COMMANDS.has(command)) return null;

	const names = args.filter((arg) => COMPONENT_NAME.test(arg)).slice(0, MAX_COMPONENTS);

	return names.length > 0 ? names : null;
}

/** `~54.0.1` → `54`. The SDK, not the patch: a major is a population, a patch is a fingerprint. */
export function expoMajor(range: string | null): number | null {
	const match = range ? /^[\^~>=\s]*(\d+)\./.exec(range) : null;

	return match?.[1] ? Number(match[1]) : null;
}

/** The error's class name — `RegistryFetchError` — and never its message, which names URLs and paths. */
export function errorKindOf(error: unknown): string {
	if (!(error instanceof Error)) return "unknown";

	const name = error.constructor.name;

	return /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(name) ? name : "Error";
}
