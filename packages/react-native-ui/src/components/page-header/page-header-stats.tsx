import { Children, type ReactElement, type ReactNode, useMemo } from "react";
import { View } from "react-native";
import { type PageHeaderStatsContextValue, PageHeaderStatsProvider, usePageHeaderPart } from "./page-header.context";
import type { PageHeaderSlotProps } from "./page-header.types";
import { type PageHeaderStatsLayout, pageHeaderVariants } from "./page-header.variants";

export type PageHeaderStatsProps = PageHeaderSlotProps & {
	/** `stacked` puts each value over its label in equal-width cells; `inline` runs them together. Default `stacked`. */
	layout?: PageHeaderStatsLayout;
	/** Hairlines between the stats. Default false. */
	isDivided?: boolean;
};

/**
 * A strip of `PageHeader.Stat`s — followers, posts, following.
 *
 * **Stacked stats are equal-width cells**, so with labels of different widths
 * the middle one still sits under the title. Inline stats wrap instead.
 *
 * Dividers are inserted between children and hidden from assistive technology;
 * a conditional child that renders nothing strands no divider, because
 * `Children.toArray` drops it first.
 */
export function PageHeaderStats({
	layout = "stacked",
	isDivided = false,
	className,
	children,
	...props
}: PageHeaderStatsProps): ReactElement {
	const { variant, align } = usePageHeaderPart("PageHeader.Stats");
	const slots = pageHeaderVariants({ variant, align, layout });
	const context = useMemo<PageHeaderStatsContextValue>(() => ({ layout }), [layout]);
	const dividerClassName = slots.divider();
	const content = useMemo(
		() => (isDivided ? withDividers(children, dividerClassName) : children),
		[children, isDivided, dividerClassName]
	);

	return (
		<PageHeaderStatsProvider value={context}>
			<View className={slots.stats({ className })} {...props}>
				{content}
			</View>
		</PageHeaderStatsProvider>
	);
}
PageHeaderStats.displayName = "DelacourUI.PageHeader.Stats";

/** Inserts a hairline between adjacent stats. */
function withDividers(children: ReactNode, className: string): ReactNode {
	const output: ReactNode[] = [];
	for (const [index, child] of Children.toArray(children).entries()) {
		if (index > 0) output.push(<PageHeaderStatsDivider className={className} key={`divider-${index}`} />);
		output.push(child);
	}
	return output;
}

/** The hairline between two stats — decoration, so hidden from assistive technology. */
function PageHeaderStatsDivider({ className }: { className: string }): ReactElement {
	return (
		<View
			accessibilityElementsHidden
			className={className}
			importantForAccessibility="no-hide-descendants"
			pointerEvents="none"
		/>
	);
}
PageHeaderStatsDivider.displayName = "DelacourUI.PageHeader.Stats.Divider";
