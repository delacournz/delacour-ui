import type { ExportsMap } from "./exports-map";

/**
 * The `package.json` and `tsconfig.json` for a shared components package.
 *
 * `init` used to `mkdir` the package directory, drop the config in it and stop —
 * leaving a directory the package manager did not know about and the app had no
 * name to import by. This writes the parts that make it a real workspace
 * package.
 *
 * Everything here is a **merge**, never a clobber. The package may be one the
 * user already had, and the CLI owns exactly three fields in it: `exports`,
 * `peerDependencies` and — only when creating the file — `name`.
 */

export type PackageJson = {
	name?: string;
	version?: string;
	private?: boolean;
	type?: string;
	main?: string;
	types?: string;
	exports?: Record<string, string>;
	dependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	[key: string]: unknown;
};

export type ScaffoldInput = {
	/** The name to use when creating the file. Ignored if one is already set. */
	name: string;
	exports: ExportsMap;
	/** Packages the components import, recorded as peers. */
	peers: readonly string[];
};

export function mergePackageJson(existing: PackageJson | null, input: ScaffoldInput): PackageJson {
	const base: PackageJson = existing ?? {
		name: input.name,
		version: "0.0.0",
		private: true,
		// Source-only, like `@delacour/native-ui`: no `main`, no `types`, no build.
		// Uniwind compiles `className` in the consuming app's Metro pipeline, so a
		// precompiled build would arrive with its classNames already dead.
		type: "module",
	};

	return {
		...base,
		// Replaced wholesale, not merged: a component the user deleted has to lose
		// its entry, and the map is derived from the disk every time.
		exports: input.exports,
		...(input.peers.length > 0 ? { peerDependencies: mergePeers(base.peerDependencies, input.peers) } : {}),
	};
}

/**
 * Peers are added at `*` and never narrowed.
 *
 * The app owns the versions — `expo install` pins them against the SDK — so a
 * range here would be a second opinion able to contradict it. A range the user
 * pinned themselves is left exactly as they wrote it.
 */
function mergePeers(existing: Record<string, string> | undefined, peers: readonly string[]): Record<string, string> {
	const merged: Record<string, string> = { ...existing };

	for (const peer of peers) {
		merged[peer] ??= "*";
	}

	return Object.fromEntries(Object.entries(merged).sort(([a], [b]) => a.localeCompare(b)));
}

export type Tsconfig = {
	compilerOptions: Record<string, unknown>;
	include: string[];
};

/** Checking only — there is no build to configure. */
export function sharedTsconfig(): Tsconfig {
	return {
		compilerOptions: {
			strict: true,
			jsx: "react-jsx",
			module: "preserve",
			moduleResolution: "bundler",
			target: "esnext",
			lib: ["esnext", "dom"],
			skipLibCheck: true,
			noEmit: true,
		},
		include: ["src"],
	};
}
