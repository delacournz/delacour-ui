import { defineConfig } from "tsdown";

/**
 * One bundled file, no runtime dependencies.
 *
 * This CLI is almost always run as `bunx delacour@latest add button` — fetched,
 * executed once, discarded. Every dependency left external is another package
 * that download has to resolve and install first, so everything is bundled in
 * and the package ships nothing but `dist`.
 *
 * `typescript` is a build-time dependency only. It powers the registry
 * builder's import scanner, which runs here and never in a consumer's project —
 * and it is roughly ten megabytes, so the entry point must not reach it. The
 * `noExternal` rule below cannot save us from that; keeping
 * `src/registry/scan-imports.ts` out of anything `src/index.ts` imports is what
 * does, and `bun run build:check` asserts it.
 */
export default defineConfig({
	entry: ["src/index.ts"],
	format: "esm",
	platform: "node",
	target: "node20.19",
	clean: true,
	dts: false,
	shims: true,
	// Bundle everything: the package has no runtime dependencies by design.
	deps: { alwaysBundle: [/.*/] },
	// `bin` points at dist/index.js, and "type": "module" makes that ESM.
	outExtensions: () => ({ js: ".js" }),
	define: {
		// The git ref this build reads the registry at. CI passes the tag it is
		// publishing, so a given release always sees the registry it shipped with.
		__REGISTRY_REF__: JSON.stringify(process.env.DELACOUR_REGISTRY_REF ?? "main"),
	},
});
