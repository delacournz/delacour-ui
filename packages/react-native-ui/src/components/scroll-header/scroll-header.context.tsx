import { createContext, use } from "react";
import type { ScrollHeaderContextValue, ScrollHeaderInternalContextValue } from "./scroll-header.types";

export const ScrollHeaderContext = createContext<ScrollHeaderInternalContextValue | null>(null);

/** The root's state for a part; throws, naming the part, outside a `<ScrollHeader>`. */
export function useScrollHeaderPart(part: string): ScrollHeaderInternalContextValue {
	const context = use(ScrollHeaderContext);
	if (!context) throw new Error(`\`${part}\` must be rendered inside a <ScrollHeader>.`);
	return context;
}

/**
 * The header's scroll source, the props to spread onto a scroller, and its progress values —
 * for a scroller the header has no part for.
 *
 * @example
 * function Sections() {
 *   const { scrollProps } = useScrollHeader();
 *   return (
 *     <Animated.SectionList ListHeaderComponent={<ScrollHeader.Inset />} sections={sections} {...scrollProps} />
 *   );
 * }
 */
export function useScrollHeader(): ScrollHeaderContextValue {
	return useScrollHeaderPart("useScrollHeader");
}
