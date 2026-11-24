import type { ResolvedConfig } from "../config/resolve";
import { CONFIG_FILENAME } from "../config/schema";
import { ensureJestConfig, type JestPatchResult } from "../project/jest-config";
import { isTestSupportItem } from "../registry/classify";
import { skipsRenderTests } from "../registry/schema";
import type { Output } from "../ui/output";

/**
 * The part of `add --tests` and `update --tests` that is only for render tests.
 *
 * They are Jest's alone. A project on Bun or Vitest is told so once, in a
 * sentence, and gets none of them; a project on Jest gets its config wired up —
 * the setup file, the resolver, the transforms — before it runs a suite that
 * would otherwise fail at the first `import`.
 */

/** The notice a Bun or Vitest project gets, once per run, whatever number of components skipped them. */
export function renderTestsNotice(runner: string): string {
	return `Render tests need Jest — set tests.runner to "jest" in ${CONFIG_FILENAME} to get them (this project's tests run on ${runner}).`;
}

export type RenderTestsOutcome = {
	/** The notice given when items had render tests this project's runner cannot run, so none were copied; otherwise `null`. */
	skipped: string | null;
	/** What was done to the Jest config; `null` when no render test was copied. */
	jestConfig: JestPatchResult | null;
};

type RenderTestItem = {
	name: string;
	renderTestRegistryDependencies: readonly string[];
	renderTests?: readonly unknown[];
};

export async function settleRenderTests(
	config: ResolvedConfig,
	items: readonly RenderTestItem[],
	output: Output
): Promise<RenderTestsOutcome> {
	if (config.testRunner !== "jest") {
		const skipped = items.some((item) => skipsRenderTests(item, config.testRunner))
			? renderTestsNotice(config.testRunner)
			: null;
		if (skipped) output.info(skipped);
		return { skipped, jestConfig: null };
	}

	// The kit or a native mock in the run: either is a file the config has to list.
	if (!items.some((item) => isTestSupportItem(item.name))) return { skipped: null, jestConfig: null };

	const jestConfig = await ensureJestConfig(config);
	report(jestConfig, output);
	return { skipped: null, jestConfig };
}

function report(result: JestPatchResult, output: Output): void {
	if (result.status === "patched") output.success(`Set ${result.file} up for the render tests`);
	if (result.status !== "manual") return;

	output.warn(
		[
			`Could not set ${result.file ?? "Jest"} up for the render tests: ${result.reasons.join(" ")}`,
			"Merge this into the Jest config:",
			result.snippet,
		].join("\n")
	);
}
