import { Children, Fragment, type ReactElement, type ReactNode, useCallback, useState } from "react";
import { type LayoutChangeEvent, ScrollView, View, type ViewProps } from "react-native";
import { Separator } from "../separator";
import { Text } from "../text";
import { useSelectionModePart } from "./selection-mode.context";
import { resolveGridItemWidth, resolveGroupLayout, selectionModeVariants } from "./selection-mode.variants";

export type SelectionModeGroupProps = ViewProps & {
	/** Lay the items out in a grid of this many columns. */
	columns?: number;
	/** A single scrolling row. Wins over `columns`. */
	isHorizontal?: boolean;
	/** Each item's width in a horizontal strip. Default 44. */
	itemWidth?: number;
	/** Space between items in a grid or a strip. Default 12. */
	gap?: number;
	/** A caption above the items, and the group's accessibility label. */
	label?: string;
	/** Hairlines between stacked items. Default `true` for a stack, `false` for a grid or a strip. */
	hasSeparators?: boolean;
	className?: string;
	labelClassName?: string;
	children?: ReactNode;
};

/**
 * The room a ring and its badge need outside an item, so a strip's scroll view
 * does not clip them.
 */
const STRIP_INSET = 8;

/**
 * Lays items out as a stacked card list, a grid or a horizontal strip.
 *
 * A stack is a card with hairlines between its rows. A grid splits the measured
 * width evenly between `columns`, less the gaps. A strip scrolls sideways, each
 * item `itemWidth` wide, with room around it for a `ring` to draw.
 *
 * A grid or a strip is announced as a list; `label` names it either way.
 */
export function SelectionModeGroup({
	columns,
	isHorizontal = false,
	itemWidth = 44,
	gap = 12,
	label,
	hasSeparators,
	className,
	labelClassName,
	children,
	...props
}: SelectionModeGroupProps): ReactElement {
	useSelectionModePart("SelectionMode.Group");
	const layout = resolveGroupLayout({ columns, isHorizontal });
	const slots = selectionModeVariants({ layout: layout.kind });
	const items = Children.toArray(children);
	const [width, setWidth] = useState(0);

	const handleLayout = useCallback((event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width), []);

	const renderBody = (): ReactElement => {
		if (layout.kind === "strip") {
			return (
				<ScrollView
					contentContainerStyle={{ gap, padding: STRIP_INSET }}
					horizontal
					showsHorizontalScrollIndicator={false}
				>
					{items.map((child, index) => (
						<View key={keyOf(child, index)} style={{ width: itemWidth }}>
							{child}
						</View>
					))}
				</ScrollView>
			);
		}

		if (layout.kind === "grid") {
			const cellWidth = resolveGridItemWidth({ columns: layout.columns, containerWidth: width, gap });
			return (
				<View className={slots.group()} onLayout={handleLayout} style={{ gap }}>
					{width > 0
						? items.map((child, index) => (
								<View key={keyOf(child, index)} style={{ width: cellWidth }}>
									{child}
								</View>
							))
						: null}
				</View>
			);
		}

		const isSeparated = hasSeparators ?? true;
		return (
			<View className={slots.group()}>
				{items.map((child, index) => (
					<Fragment key={keyOf(child, index)}>
						{isSeparated && index > 0 ? <Separator /> : null}
						{child}
					</Fragment>
				))}
			</View>
		);
	};

	return (
		<View
			accessibilityLabel={label}
			accessibilityRole={layout.kind === "stack" ? undefined : "list"}
			className={className}
			{...props}
		>
			{label ? <Text className={slots.groupLabel({ className: labelClassName })}>{label}</Text> : null}
			{renderBody()}
		</View>
	);
}
SelectionModeGroup.displayName = "DelacourUI.SelectionMode.Group";

/** The key `Children.toArray` already gave a child, or its index for a bare value. */
function keyOf(child: ReturnType<typeof Children.toArray>[number], index: number): string | number {
	return typeof child === "object" && child !== null && "key" in child && child.key !== null ? child.key : index;
}
