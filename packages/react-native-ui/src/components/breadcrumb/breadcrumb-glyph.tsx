import { type ReactElement, type ReactNode, useMemo } from "react";
import { IconDefaultsProvider } from "../icon";
import { BREADCRUMB_GLYPH_COLOR, type BreadcrumbSize, breadcrumbVariants } from "./breadcrumb.variants";

/**
 * Sizes and tints every unstyled `Icon` beneath it for a breadcrumb glyph — the
 * separator's chevron, the ellipsis' dots, an icon a caller puts in a link.
 *
 * Internal. One provider rather than a `size` and `color` restated at each of
 * those three call sites, so a retuned glyph step moves all of them together.
 */
export function BreadcrumbGlyph({ size, children }: { size: BreadcrumbSize; children: ReactNode }): ReactElement {
	const className = breadcrumbVariants({ size }).glyph() ?? "";
	const value = useMemo(() => ({ className, color: BREADCRUMB_GLYPH_COLOR }), [className]);
	return <IconDefaultsProvider value={value}>{children}</IconDefaultsProvider>;
}
BreadcrumbGlyph.displayName = "DelacourUI.Breadcrumb.Glyph";
