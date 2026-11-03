import { persistTestsEnabled } from "../config/persist";
import type { ResolvedConfig } from "../config/resolve";

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
