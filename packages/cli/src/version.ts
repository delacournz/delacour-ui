declare const __CLI_VERSION__: string | undefined;

/**
 * Replaced at build time from `package.json` (see `tsdown.config.ts`).
 * `npm_package_version` only exists under a package manager running a script,
 * and `bunx delacour` is neither — it would have reported the fallback forever.
 *
 * Its own module so `program.ts` and `telemetry/client.ts` read one value.
 */
export const CLI_VERSION: string = typeof __CLI_VERSION__ === "string" ? __CLI_VERSION__ : "0.0.0-dev";
