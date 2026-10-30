import { z } from "zod";
import { NAMESPACES } from "../registry/namespaces";
import { PREFIX_PATTERN } from "../registry/prefix";
import { TEST_RUNNERS } from "../registry/test-runner";

/**
 * `native-components.json` — the file that says where components go and how the app
 * around them is wired.
 *
 * Two things are kept apart that shadcn's `aliases` conflate: **where a file
 * lands on disk** and **what other files import it as**. They are only the same
 * when a project has path aliases configured, and an Expo app may not — Metro
 * resolves `tsconfig` paths only with `experiments.tsconfigPaths` on. Recording
 * both means `add` never has to parse a `tsconfig` to work out where anything
 * went, and a project with no aliases at all still gets working relative
 * imports.
 *
 * The file lives wherever the components live. In a monorepo that is the shared
 * package, and `app` then points back at the Expo app that consumes it — which
 * is the only part of the project the CLI has to touch but does not own.
 */

const pathsSchema = z.object({
	/** Component folders: `ui/button/button.tsx` → `<ui>/button/button.tsx`. */
	ui: z.string(),
	lib: z.string(),
	hooks: z.string(),
	styles: z.string(),
	icons: z.string(),
});

const aliasesSchema = pathsSchema.partial();

const appSchema = z.object({
	/** The Expo app root, relative to this config. `.` when they are the same place. */
	root: z.string().default("."),
	/** The Tailwind entry Metro compiles, relative to `root`. */
	css: z.string().default("src/styles/global.css"),
	metroConfig: z.string().default("metro.config.js"),
	/** Where Uniwind writes its generated `className` types. */
	uniwindTypes: z.string().default("src/uniwind-types.d.ts"),
});

const registrySchema = z.object({
	/** Repository base. Items are read from `<url>/<ref>/registry/…`. */
	url: z.string().optional(),
	/** Git ref to read the registry at. Defaults to the tag the CLI was published from. */
	ref: z.string().optional(),
});

/**
 * The shared package the components live in, when they do not live in the app.
 *
 * Its presence is the whole signal for the monorepo layout: it means `add`
 * maintains an `exports` map, records native peers on the package rather than
 * as dependencies, and the app imports `@acme/ui/button` instead of reaching
 * across the workspace by relative path.
 */
const packageSchema = z.object({
	/** The package's npm name, and therefore the app's import prefix. */
	name: z.string().min(1),
});

/**
 * How copied tests are written. Without a `runner`, `add --tests` reads the one
 * the project's `package.json` tests with, and falls back to Bun's, which the
 * library's suites are written for.
 */
const testsSchema = z.object({
	runner: z.enum(TEST_RUNNERS).optional(),
});

export const configSchema = z.object({
	$schema: z.string().optional(),
	framework: z.enum(["expo", "react-native"]).default("expo"),
	typescript: z.boolean().default(true),
	registry: registrySchema.default({}),
	/** Extra registries by namespace: `{ "@acme": "https://…" }` → `add @acme/card`. */
	registries: z.record(z.string(), z.string()).default({}),
	paths: pathsSchema,
	aliases: aliasesSchema.default({}),
	/** Absent when the components live in the app itself. */
	package: packageSchema.optional(),
	app: appSchema.prefault({}),
	tests: testsSchema.optional(),
	/**
	 * What copied components call the library, in place of `DelacourUI`: the head
	 * of every `displayName` and thrown-message tag, and the provider's name —
	 * `"UI"` gives `UI.Flow.Provider` and `UIProvider`. Read by `add` and `update`.
	 */
	prefix: z.string().regex(PREFIX_PATTERN, "must be a PascalCase identifier, like UI or Acme").optional(),
});

export type Config = z.infer<typeof configSchema>;
export type ConfigPackage = z.infer<typeof packageSchema>;
export type ConfigPaths = z.infer<typeof pathsSchema>;
export type ConfigAliases = z.infer<typeof aliasesSchema>;

export const CONFIG_FILENAME = "native-components.json";

export const CONFIG_SCHEMA_URL =
	"https://raw.githubusercontent.com/delacournz/delacour-ui/main/registry/config.schema.json";

/**
 * The layout `init` proposes for a plain Expo app.
 *
 * `icons` sits under `lib` rather than beside the components because it is a
 * re-export of an icon set, not a component anyone renders.
 */
export const DEFAULT_PATHS: ConfigPaths = {
	ui: "src/components/ui",
	lib: "src/lib",
	hooks: "src/hooks",
	styles: "src/styles",
	icons: "src/lib/icons",
};

/** Every namespace has a path; a config missing one would write files nowhere. */
export function assertPathsComplete(paths: Partial<ConfigPaths>): asserts paths is ConfigPaths {
	const missing = NAMESPACES.filter((namespace) => !paths[namespace]);
	if (missing.length > 0) throw new Error(`${CONFIG_FILENAME} is missing paths for: ${missing.join(", ")}`);
}
