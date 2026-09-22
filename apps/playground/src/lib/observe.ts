import type { ObserveConfig } from "expo-observe";

/**
 * What `Observe.configure` is handed at startup, as a pure function so
 * `bun test` can reach it — `expo-observe` itself is a native module and
 * cannot be imported outside a build.
 *
 * **The `expo-router` integration is off by default** in `expo-observe`, and
 * it is the part that answers "what do people open": with it on, every focus
 * records a `cold_ttr` or `warm_ttr` keyed by the route's segments. No route
 * here carries anything identifying — `/preview`'s `component`, `demo`
 * and `theme` are the most there is — so no `filteredParams`.
 *
 * **Debug builds dispatch nothing unless `EXPO_PUBLIC_OBSERVE_IN_DEBUG=1`.**
 * A dev client runs unoptimised JS against Metro, so its startup numbers would
 * only drag the release percentiles around. The flag is there to prove the
 * wiring end to end from a dev client without a code change that could ship;
 * it has no effect on a release build either way. The check is on the exact
 * value, because an unset EAS variable renders as the literal `undefined`.
 */
export function observeConfig(dispatchInDebugFlag: string | undefined): ObserveConfig {
	return {
		dispatchInDebug: dispatchInDebugFlag === "1",
		integrations: { "expo-router": true },
	};
}
