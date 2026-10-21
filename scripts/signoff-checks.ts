/**
 * What a pull request has to pass before it can merge, and which of it a given diff actually needs.
 *
 * Pull requests into `develop` are gated on commit statuses written from the authoring machine by
 * `scripts/signoff.ts`, not on GitHub Actions jobs. Every check here had already run locally — through
 * prek, through `bun test`, or through the agent that wrote the change — and then ran a second time
 * on billed runners. `ci.yml` is now `workflow_dispatch`-only for ordinary pull requests (it still
 * runs on the release pull request, which no person authors; see AGENTS.md § Signoff), so the gate
 * lives here instead, in the one file both halves read.
 *
 * Two kinds of check, and the difference is the whole design:
 *
 *   `always: true`  — typecheck / check / test / build. Nothing can change without them being
 *                     relevant, so they run on every pull request and their contexts are REQUIRED by
 *                     `.github/rulesets/develop.json`.
 *   `always: false` — `registry`. Path-gated, so most pull requests never run it. Deliberately NOT
 *                     required: a ruleset's required-check list is static, and a required context
 *                     that never arrives leaves the pull request unmergeable forever.
 *
 * A path-gated check still blocks the merge — transitively. `signoff.ts` withholds the umbrella
 * `signoff` context, which IS required, unless every applicable check passed. So a pull request
 * touching `packages/react-native-ui/**` cannot merge without the registry drift check having run,
 * while a docs-site-only one is never asked for it.
 *
 * `verify-expo` (the CLI against a real, npm-installed Expo app) is absent on purpose. It installs
 * from the registry and takes minutes; it stays a `workflow_dispatch` job in `ci.yml`, and the
 * structure-only half of it (`verify:expo --no-install`) runs inside `registry`.
 */

/** One process to spawn. `cwd` is repo-root-relative; omitted means the repo root. */
export type SignoffCommand = { argv: readonly string[]; cwd?: string };

export type SignoffCheck = {
	/** Status context, published as `signoff/<context>`. */
	context: string;
	/** Human label — matches the `ci.yml` job name this replaces, so pull request history reads the same. */
	label: string;
	/** Runs on every pull request and is required by `develop-protected`. */
	always: boolean;
	/** Glob patterns against repo-relative changed paths. Empty means "always applicable". */
	paths: readonly string[];
	/** The workflow that still runs this check on `workflow_dispatch`, for the escape hatch. */
	workflow: string;
	run: readonly SignoffCommand[];
	/**
	 * Resources this check holds for its whole run; `signoff.ts` never runs two checks naming the
	 * same one at once (see ./signoff-pool.ts).
	 */
	locks?: readonly string[];
};

/** The bare context the ruleset requires. Emitted last, and only when everything passed. */
export const UMBRELLA_CONTEXT = "signoff";

export const SIGNOFF_CHECKS: readonly SignoffCheck[] = [
	{
		context: "typecheck",
		label: "typecheck",
		always: true,
		paths: [],
		workflow: "ci.yml",
		run: [{ argv: ["bunx", "turbo", "typecheck"] }],
	},
	{
		context: "check",
		label: "check (lint + format)",
		always: true,
		paths: [],
		workflow: "ci.yml",
		run: [{ argv: ["bunx", "turbo", "check"] }],
	},
	{
		context: "test",
		label: "test",
		always: true,
		paths: [],
		workflow: "ci.yml",
		// `test:release` and `test:scripts` are root-package tasks: `.github/*.test.ts` and
		// `scripts/*.test.ts` belong to no workspace.
		run: [{ argv: ["bunx", "turbo", "test", "test:release", "test:scripts"] }],
	},
	{
		context: "build",
		label: "build",
		always: true,
		paths: [],
		workflow: "ci.yml",
		// Scoped to the docs site: it is the only thing Railway deploys, and an unfiltered build would
		// drag in the Expo playground for nothing.
		run: [{ argv: ["bunx", "turbo", "build", "--filter=@delacour/web"] }],
	},
	{
		context: "registry",
		label: "registry",
		always: false,
		// What the registry, the docs install manifest and the skill's component list are derived
		// from. A dependency range moving in a manifest changes registry metadata, hence the lockfile.
		paths: [
			"packages/react-native-ui/**",
			"packages/react-native-charts/**",
			"packages/react-native-bottom-sheet/**",
			"packages/cli/**",
			"packages/skills/**",
			"registry/**",
			"apps/web/scripts/gen-install-manifest.ts",
			"apps/web/src/registry/**",
			"package.json",
			"bun.lock",
		],
		workflow: "ci.yml",
		// One turbo run regenerates all three (gen-install and gen-skill depend on registry:build in
		// turbo.jsonc), then the diff proves the committed copies were already current, then the CLI's
		// structure-only verify — both layouts — runs against that registry.
		run: [
			{
				argv: [
					"bunx",
					"turbo",
					"registry:build",
					"gen-install",
					"gen-skill",
					"--filter=delacour",
					"--filter=@delacour/web",
					"--filter=@delacour/skills",
				],
			},
			{
				argv: [
					"git",
					"diff",
					"--exit-code",
					"--",
					"registry/",
					"apps/web/src/registry/install.ts",
					"packages/skills/src/components.generated.ts",
				],
			},
			{ argv: ["bunx", "turbo", "verify:expo", "--filter=delacour", "--", "--no-install"] },
			{ argv: ["bunx", "turbo", "verify:expo", "--filter=delacour", "--", "--no-install", "--layout", "monorepo"] },
		],
	},
];

/** The always-on contexts, in declaration order. */
export const ALWAYS_CONTEXTS: readonly string[] = SIGNOFF_CHECKS.filter((check) => check.always).map(
	(check) => check.context
);

/**
 * Exactly what `.github/rulesets/develop.json` must require. Path-gated contexts are absent by
 * design — see the header.
 */
export const REQUIRED_CONTEXTS: readonly string[] = [
	UMBRELLA_CONTEXT,
	...ALWAYS_CONTEXTS.map((context) => `${UMBRELLA_CONTEXT}/${context}`),
];

export type PlannedCheck = {
	check: SignoffCheck;
	applicable: boolean;
	/** Why it was skipped. Empty when applicable. */
	reason: string;
};

/** Files that can never affect a path-gated check. Nothing here imports a markdown file. */
const IGNORED_PATHS = ["**/*.md"] as const;

/** Whether any changed path matches any of the check's globs. */
function matches(changed: readonly string[], patterns: readonly string[]): boolean {
	const globs = patterns.map((pattern) => new Bun.Glob(pattern));
	return changed.some((file) => globs.some((glob) => glob.match(file)));
}

/**
 * Resolve a changed-file list into the full check plan — every check, applicable or not, so the
 * report can state what was skipped and why rather than silently omitting it.
 */
export function planChecks(changed: readonly string[]): PlannedCheck[] {
	const ignored = IGNORED_PATHS.map((pattern) => new Bun.Glob(pattern));
	const relevant = changed.filter((file) => !ignored.some((glob) => glob.match(file)));
	return SIGNOFF_CHECKS.map((check) => {
		if (check.always || matches(relevant, check.paths)) return { check, applicable: true, reason: "" };
		return { check, applicable: false, reason: `no files matched ${check.paths.join(", ")}` };
	});
}
