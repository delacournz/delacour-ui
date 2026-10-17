import type { ReactElement } from "react";
import { Text, type TextPresetProps } from "../text";
import { useBreadcrumbPart } from "./breadcrumb.context";
import { BREADCRUMB_TEXT_SIZE, breadcrumbVariants } from "./breadcrumb.variants";

export type BreadcrumbPageProps = TextPresetProps;

/**
 * The current page — the last crumb, plain text and never pressable.
 *
 * Foreground and medium against the links' muted regular, so where the reader
 * is stands out from where they could go. Announced as selected, with the value
 * "current page".
 */
export function BreadcrumbPage({
	className,
	size,
	accessibilityState,
	accessibilityValue,
	...props
}: BreadcrumbPageProps): ReactElement {
	const context = useBreadcrumbPart("Breadcrumb.Page");

	return (
		<Text
			accessibilityRole="text"
			accessibilityState={{ ...accessibilityState, selected: true }}
			accessibilityValue={accessibilityValue ?? { text: "current page" }}
			className={breadcrumbVariants({ size: context.size }).page({ className })}
			size={size ?? BREADCRUMB_TEXT_SIZE[context.size]}
			{...props}
		/>
	);
}
BreadcrumbPage.displayName = "DelacourUI.Breadcrumb.Page";
