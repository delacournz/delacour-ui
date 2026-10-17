import { Children, isValidElement, type ReactElement, type ReactNode, useCallback, useMemo, useRef } from "react";
import { ScrollView, View, type ViewProps } from "react-native";
import { useBreadcrumbPart } from "./breadcrumb.context";
import {
	type BreadcrumbChildKind,
	type BreadcrumbOverflow,
	breadcrumbVariants,
	resolveBreadcrumbCollapse,
	resolveBreadcrumbOverflow,
	resolveBreadcrumbSequence,
} from "./breadcrumb.variants";
import { BreadcrumbEllipsis } from "./breadcrumb-ellipsis";
import { BreadcrumbItem } from "./breadcrumb-item";
import { BreadcrumbSeparator } from "./breadcrumb-separator";

export type BreadcrumbListProps = ViewProps & {
	/** Collapse when the item count exceeds this. Unset never collapses. */
	maxItems?: number;
	/** Items kept ahead of the ellipsis when collapsed. Default 1. */
	itemsBeforeCollapse?: number;
	/** Items kept after the ellipsis when collapsed — never fewer than the current page. Default 1. */
	itemsAfterCollapse?: number;
	/** Makes the ellipsis a button. Receives the hidden items' indices, zero-based. */
	onEllipsisPress?: (hiddenIndices: readonly number[]) => void;
	/**
	 * What a trail too long for the row does. Defaults to `collapse` with a
	 * `maxItems`, otherwise `wrap`. `scroll` runs on in a horizontal scroller
	 * opened at the current page.
	 */
	overflow?: BreadcrumbOverflow;
	className?: string;
	children?: ReactNode;
};

/**
 * The trail: the items in order, a separator between each pair, and the
 * ellipsis when it collapses.
 *
 * Counts its direct children the way `Steps` does — a `.map()` is flattened and
 * counts; an item behind a wrapper does not, and warns in development.
 */
export function BreadcrumbList({
	maxItems,
	itemsBeforeCollapse = 1,
	itemsAfterCollapse = 1,
	onEllipsisPress,
	overflow: overflowProp,
	accessibilityLabel = "Breadcrumb",
	className,
	children,
	...props
}: BreadcrumbListProps): ReactElement {
	const { size } = useBreadcrumbPart("Breadcrumb.List");
	const overflow = resolveBreadcrumbOverflow({ maxItems, overflow: overflowProp });
	const childArray = useMemo(() => Children.toArray(children), [children]);

	const kinds = useMemo(
		() =>
			childArray.map((child): BreadcrumbChildKind => {
				if (!isValidElement(child)) return "other";
				if (child.type === BreadcrumbItem) return "item";
				if (child.type === BreadcrumbSeparator) return "separator";
				return "other";
			}),
		[childArray]
	);

	if (
		process.env.NODE_ENV !== "production" &&
		kinds.some((kind, i) => kind === "other" && isValidElement(childArray[i]))
	) {
		console.warn(
			"Breadcrumb.List: a direct child is neither a <Breadcrumb.Item> nor a <Breadcrumb.Separator>, so it is not " +
				"counted and gets no separator. Render items directly, or from a .map(), rather than behind a wrapper component."
		);
	}

	const count = kinds.filter((kind) => kind === "item").length;
	const collapse =
		overflow === "collapse"
			? resolveBreadcrumbCollapse({ after: itemsAfterCollapse, before: itemsBeforeCollapse, count, maxItems })
			: ({ kind: "all" } as const);
	const sequence = resolveBreadcrumbSequence(kinds, collapse);

	const rendered = sequence.map((entry) => {
		if (entry.kind === "child") return childArray[entry.index];
		if (entry.kind === "separator") return <BreadcrumbSeparator key={entry.key} />;
		return (
			<BreadcrumbEllipsis
				hiddenCount={entry.hidden.length}
				key="ellipsis"
				onPress={onEllipsisPress ? () => onEllipsisPress(entry.hidden) : undefined}
			/>
		);
	});

	const slots = breadcrumbVariants({ overflow, size });

	const scrollRef = useRef<ScrollView>(null);
	const scrollToEnd = useCallback(() => {
		scrollRef.current?.scrollToEnd({ animated: false });
	}, []);

	// A scrolling trail opens at its end, where the current page is, and returns
	// there whenever the trail itself changes length.
	if (overflow === "scroll") {
		return (
			<ScrollView
				accessibilityLabel={accessibilityLabel}
				accessibilityRole="none"
				className={className}
				contentContainerClassName={slots.scroller()}
				horizontal
				onContentSizeChange={scrollToEnd}
				ref={scrollRef}
				showsHorizontalScrollIndicator={false}
				{...props}
			>
				{rendered}
			</ScrollView>
		);
	}

	return (
		<View
			accessibilityLabel={accessibilityLabel}
			accessibilityRole="none"
			className={slots.list({ className })}
			{...props}
		>
			{rendered}
		</View>
	);
}
BreadcrumbList.displayName = "DelacourUI.Breadcrumb.List";
