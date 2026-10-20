import type { ReactElement } from "react";
import { View } from "react-native";
import { IconArrowDown, IconArrowUp, IconSortArrowUpDown } from "../../icons/central";
import { Icon, type IconComponent } from "../icon";
import { Pressable, type PressableProps } from "../pressable";
import { Text } from "../text";
import { useTableCell, useTablePart } from "./table.context";
import type { TableCellBaseProps } from "./table.types";
import {
	readNodeText,
	resolveCellLayout,
	resolveTableSortAccessibility,
	resolveTableSortGlyph,
	type TableHeadSort,
	type TableSortGlyph,
	tableVariants,
} from "./table.variants";

export type TableHeadProps = TableCellBaseProps & {
	/**
	 * Makes the head a button. With a `direction` it is the sorted column and
	 * draws that direction; without one it is sortable and draws a dimmed
	 * both-ways glyph. The caller owns the order — `onPress` is where it changes.
	 */
	sort?: TableHeadSort;
	/** Haptic played when a sortable head is pressed. */
	haptic?: PressableProps["haptic"];
};

const SORT_GLYPHS: Record<Exclude<TableSortGlyph, "none">, IconComponent> = {
	asc: IconArrowUp,
	desc: IconArrowDown,
	unsorted: IconSortArrowUpDown,
};

/**
 * One column heading.
 *
 * Takes its column's width and alignment exactly as a `Table.Cell` does, so the
 * heading sits over its values. Bare text is a muted label; the sorted column's
 * label steps up to the foreground.
 *
 * With `sort` the head is one button, announced with its sort state as its
 * value — "Qty, button, sorted descending".
 */
export function TableHead({
	column,
	sort,
	haptic = "selection",
	labelClassName,
	className,
	style,
	children,
	...props
}: TableHeadProps): ReactElement {
	const { columns, size } = useTablePart("Table.Head");
	const cell = useTableCell();
	const layout = resolveCellLayout(columns, cell?.index ?? 0, column);
	const glyph = resolveTableSortGlyph(sort);
	const isSorted = glyph === "asc" || glyph === "desc";
	const slots = tableVariants({ align: layout.align, isDisabled: cell?.isDisabled ?? false, isSorted, size });

	const text = readNodeText(children);
	const label =
		text === undefined ? (
			children
		) : (
			<Text.Label className={slots.headText({ className: labelClassName })}>{text}</Text.Label>
		);

	const a11y = resolveTableSortAccessibility(sort);
	const content =
		sort && a11y.isSortable && glyph !== "none" ? (
			<Pressable
				accessibilityLabel={text}
				accessibilityValue={{ text: a11y.valueText }}
				className={slots.sort()}
				feedback="fade"
				haptic={haptic}
				onPress={sort.onPress}
			>
				{label}
				<Icon
					className={slots.sortIcon()}
					color={isSorted ? "foreground" : "muted-foreground"}
					icon={SORT_GLYPHS[glyph]}
				/>
			</Pressable>
		) : (
			label
		);

	return (
		<View className={slots.head({ className })} style={[layout.style, style]} {...props}>
			{content}
		</View>
	);
}
TableHead.displayName = "DelacourUI.Table.Head";
