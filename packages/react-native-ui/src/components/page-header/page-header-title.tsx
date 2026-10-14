import type { ReactElement } from "react";
import { Text, type TextPresetProps } from "../text";
import { usePageHeaderPart } from "./page-header.context";
import { isEmptyText } from "./page-header.utils";
import { pageHeaderVariants } from "./page-header.variants";

export type PageHeaderTitleProps = TextPresetProps;

/**
 * The name — `Text.Title`, on one line, announced as a heading.
 *
 * The heading role goes here rather than on the whole header, which would fold
 * the actions into one element a screen reader cannot step into. An empty title
 * renders nothing, so the column leaves no gap for it.
 */
export function PageHeaderTitle({
	className,
	numberOfLines = 1,
	children,
	...props
}: PageHeaderTitleProps): ReactElement | null {
	const { align } = usePageHeaderPart("PageHeader.Title");
	if (isEmptyText(children)) return null;
	return (
		<Text.Title className={pageHeaderVariants({ align }).title({ className })} numberOfLines={numberOfLines} {...props}>
			{children}
		</Text.Title>
	);
}
PageHeaderTitle.displayName = "DelacourUI.PageHeader.Title";
