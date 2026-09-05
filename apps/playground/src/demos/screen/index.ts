import { defineDemoGroup } from "../define-demo-group";
import * as aPushedScreen from "./a-pushed-screen";
import * as inbox from "./inbox";
import * as loadingAndError from "./loading-and-error";
import * as showcase from "./showcase";

/**
 * Key order is the reading order — the whole composition first, then the
 * chrome a pushed screen adds, then the states a route returns instead, and
 * last the catalogue the documentation site puts in its hero.
 *
 * These are purpose-built rather than migrated from `src/app/(components)/screen/`.
 * Those routes stay hand-written: they are the harness, they wire a real router
 * into every back control, and a demo cannot — the import allowlist keeps
 * `expo-router` out so the published snippet compiles in a reader's app.
 */
export const screenDemos = defineDemoGroup("screen", {
	inbox,
	"a-pushed-screen": aPushedScreen,
	"loading-and-error": loadingAndError,
	showcase,
});
