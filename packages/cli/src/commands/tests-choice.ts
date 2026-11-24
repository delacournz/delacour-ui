import { persistTestsEnabled } from "../config/persist";
import type { ResolvedConfig } from "../config/resolve";
import { ensureTestScripts, type TestScriptsResult } from "../project/test-scripts";
import { type Output, style } from "../ui/output";

/**
 * Whether this run copies tests, and remembering the answer.
 *
 * `--tests` / `--no-tests` win for the run and are saved as `tests.enabled`, so
 * the next `add` or `update` needs no flag. Without one the saved answer
 * stands, and a project that never answered gets no tests, as before.
 * `persist: false` is for a dry run, which must write nothing.
 */
export async function chooseTests(config: ResolvedConfig, flag: boolean | undefined, persist = true): Promise<boolean> {
	if (flag === undefined) return config.testsEnabled;
	if (persist) await persistTestsEnabled(config.configPath, flag);
	return flag;
}

/**
 * Adds the `test:ui` scripts once tests are copied, and says which. Silent when
 * every one was already there — an existing script is the project's.
 */
export async function settleTestScripts(config: ResolvedConfig, output: Output): Promise<TestScriptsResult> {
	const result = await ensureTestScripts(config);
	if (result.status === "added") {
		output.success(`Added ${result.scripts.map((name) => style.code(name)).join(", ")} to ${result.file}`);
	}
	if (result.status === "manual") output.warn(`Could not add the test scripts: ${result.reason}`);
	return result;
}
