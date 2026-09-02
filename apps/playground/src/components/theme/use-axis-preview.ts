import type { DesignSystemConfig } from "@delacour/design-system/config";
import { type ResolvedMode, resolveTokens } from "@delacour/design-system/resolve";
import { useCallback, useMemo } from "react";
import { useUniwind } from "uniwind";
import { useDesignSystem } from "@/design-system/store";

export type AxisPreview = {
	config: DesignSystemConfig;
	mode: "light" | "dark";
	/** The live tokens — for a row that reports what is applied. */
	resolved: ResolvedMode;
	/** The tokens with one axis swapped — for a row that offers a choice. */
	preview: (candidate: Partial<DesignSystemConfig>) => ResolvedMode;
};

/**
 * The design system as it is, and as one changed axis would make it.
 *
 * Every preview resolves the WHOLE system with that one axis changed rather
 * than reading the option's own values, because a base colour's `primary` is
 * not what `primary` becomes once an accent is spread over it — a row that lied
 * about its own outcome would be worse than no preview at all.
 *
 * `resolved` is memoised on `[config, mode]`, which is what keeps eight
 * always-mounted sheets affordable: `config`'s identity only changes when
 * `setAxis` or `resetConfig` replaces it in the store, so a render caused by
 * anything else does no token work at all. A theme flip moves `mode` and
 * correctly invalidates every swatch on screen.
 *
 * It cannot live in `design-system/` — those files import nothing from React
 * Native so `bun test` can load them, and `useUniwind` pulls in the whole tree.
 */
export function useAxisPreview(): AxisPreview {
	const config = useDesignSystem();
	const { theme } = useUniwind();
	const mode = theme === "dark" ? "dark" : "light";

	const resolved = useMemo(() => resolveTokens(config)[mode], [config, mode]);

	const preview = useCallback(
		(candidate: Partial<DesignSystemConfig>) => resolveTokens({ ...config, ...candidate })[mode],
		[config, mode]
	);

	return { config, mode, resolved, preview };
}
