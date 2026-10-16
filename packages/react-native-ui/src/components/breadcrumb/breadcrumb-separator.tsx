import type { ReactElement, ReactNode } from "react";
import { I18nManager, View } from "react-native";
import { IconChevronLeft, IconChevronRight } from "../../icons/central";
import { Icon } from "../icon";
import { Text } from "../text";
import { useBreadcrumbPart } from "./breadcrumb.context";
import type { BreadcrumbSlotProps } from "./breadcrumb.types";
import {
	BREADCRUMB_TEXT_SIZE,
	type BreadcrumbSize,
	breadcrumbVariants,
	resolveBreadcrumbSeparatorGlyph,
} from "./breadcrumb.variants";
import { BreadcrumbGlyph } from "./breadcrumb-glyph";

export type BreadcrumbSeparatorProps = BreadcrumbSlotProps;

const CHEVRON = { "chevron-left": IconChevronLeft, "chevron-right": IconChevronRight } as const;

/**
 * The mark between two crumbs — a chevron pointing along the reading
 * direction, so it flips in a right-to-left layout.
 *
 * `Breadcrumb.List` inserts one between every pair, so a caller writes one only
 * to change a single gap; it then stands in for the automatic separator beside
 * it. Its children replace the glyph, else the root's `separator` does. Text is
 * drawn muted at the breadcrumb's size, an `Icon` in the glyph's size and colour.
 *
 * Hidden from assistive technology, like `Separator`: the order of the links
 * already says what the chevron draws.
 */
export function BreadcrumbSeparator({ className, children, ...props }: BreadcrumbSeparatorProps): ReactElement {
	const { size, separator } = useBreadcrumbPart("Breadcrumb.Separator");
	const content = children ?? separator;

	return (
		<View
			accessibilityElementsHidden
			className={breadcrumbVariants({ size }).separator({ className })}
			importantForAccessibility="no-hide-descendants"
			{...props}
		>
			<BreadcrumbGlyph size={size}>
				{content === undefined || content === null ? (
					<Icon icon={CHEVRON[resolveBreadcrumbSeparatorGlyph(I18nManager.isRTL)]} />
				) : (
					wrapText(content, size)
				)}
			</BreadcrumbGlyph>
		</View>
	);
}
BreadcrumbSeparator.displayName = "DelacourUI.Breadcrumb.Separator";

/** Wraps a bare-text separator — `"/"`, `"·"` — in a muted `Text` at the breadcrumb's size. */
function wrapText(content: ReactNode, size: BreadcrumbSize): ReactNode {
	if (typeof content !== "string" && typeof content !== "number") return content;
	return (
		<Text className="text-muted-foreground" size={BREADCRUMB_TEXT_SIZE[size]}>
			{content}
		</Text>
	);
}
