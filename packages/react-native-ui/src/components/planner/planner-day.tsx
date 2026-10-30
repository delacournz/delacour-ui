import type { ReactElement, ReactNode } from "react";
import { View } from "react-native";
import { cn } from "../../lib/cn";
import { Icon } from "../icon";
import { Pressable } from "../pressable";
import { Text } from "../text";
import { type PlannerContextValue, usePlannerPart } from "./planner.context";
import type { PlannerDayInfo, PlannerDayRenderer, PlannerEntry } from "./planner.types";
import {
	entryColorToken,
	type PlannerEntryColor,
	plannerVariants,
	resolveDayDisplay,
	resolveEntryColor,
	resolvePlannerDayLabel,
} from "./planner.variants";
import { toDayKey } from "./planner-dates";

export type PlannerDayProps = {
	date: Date;
	/** False for a neighbouring month's day. Defaults to `true`. */
	isInMonth?: boolean;
	/** Draws the day's content in place of the variant's. The button, label and state stay the planner's. */
	renderDay?: PlannerDayRenderer;
	/** Merged onto the day's cell — the box that sets its height. */
	className?: string;
	testID?: string;
};

const NO_ENTRIES: readonly PlannerEntry[] = [];

/**
 * One day's button.
 *
 * Every day is a single accessibility element labelled with its date, its
 * count and its categories — "Wednesday, 14 October, 3 entries, Run, Strength"
 * — with ", today" when it is, and `selected` as the button's state. A
 * neighbouring month's day is muted, and with `showOutsideDays` off it is an
 * empty, unannounced cell that still holds its place in the week.
 */
export function PlannerDay({ date, isInMonth = true, renderDay, className, testID }: PlannerDayProps): ReactElement {
	const planner = usePlannerPart("Planner.Day");
	const { entriesByDay, todayKey, selected, variant, fill, categories, locale, pressDay, showOutsideDays } = planner;

	const key = toDayKey(date);
	const entries = entriesByDay.get(key) ?? NO_ENTRIES;
	const isToday = key === todayKey;
	const isSelected = selected !== null && toDayKey(selected) === key;
	const slots = plannerVariants({ fill, isInMonth, isSelected, isToday, variant });

	if (!(isInMonth || showOutsideDays)) {
		return (
			<View
				accessibilityElementsHidden
				className={slots.cell({ className })}
				importantForAccessibility="no-hide-descendants"
			/>
		);
	}

	const info: PlannerDayInfo = { date, key, entries, isToday, isInMonth, isSelected };

	return (
		<View className={slots.cell({ className })}>
			<Pressable
				accessibilityLabel={resolvePlannerDayLabel({ date, entries, categories, isToday, locale })}
				accessibilityState={{ selected: isSelected }}
				className={variant === "tiles" ? "flex-1" : slots.day()}
				feedback="fade"
				onPress={() => pressDay(date)}
				testID={testID}
			>
				{renderDay ? renderDay(info) : <PlannerDayContent info={info} planner={planner} />}
			</Pressable>
		</View>
	);
}
PlannerDay.displayName = "DelacourUI.Planner.Day";

type PlannerDayContentProps = { info: PlannerDayInfo; planner: PlannerContextValue };

/**
 * The variant's own drawing of a day.
 *
 * Separate from `PlannerDay` so a `renderDay` replaces exactly this and
 * nothing else — the button, its label and its state are never the caller's
 * to forget.
 */
function PlannerDayContent({ info, planner }: PlannerDayContentProps): ReactElement {
	if (planner.variant === "tiles") return <PlannerDayTile info={info} planner={planner} />;
	if (planner.variant === "calendar") return <PlannerDayBlocks info={info} planner={planner} />;
	return <PlannerDayMarks info={info} planner={planner} />;
}
PlannerDayContent.displayName = "DelacourUI.Planner.Day.Content";

/** `tiles`: one large icon tinted by the first entry's colour, the date in the corner. */
function PlannerDayTile({ info, planner }: PlannerDayContentProps): ReactElement {
	const { variant, fill, entryLimit, categories } = planner;
	const { entries, isInMonth, isSelected, isToday } = info;
	const slots = plannerVariants({ fill, isInMonth, isSelected, isToday, variant });
	const { shown, overflow } = resolveDayDisplay(entries, variant, entryLimit);
	const first = shown[0];
	const color = first ? resolveEntryColor(first, categories) : undefined;

	let mark: ReactNode = null;
	if (first?.icon && color) {
		mark = <Icon color={isSelected ? "primary-foreground" : entryColorToken(color)} icon={first.icon} size="lg" />;
	} else if (first && color) {
		mark = <PlannerDayDot className={slots.dot()} color={color} />;
	}

	return (
		<View className={cn(slots.tile(), !isSelected && color ? tintClass(color) : undefined)}>
			<Text className={slots.tileNumeral()}>{String(info.date.getDate())}</Text>
			{mark}
			{overflow > 0 ? <Text className={cn(slots.overflow(), "absolute right-1 bottom-0.5")}>+{overflow}</Text> : null}
		</View>
	);
}
PlannerDayTile.displayName = "DelacourUI.Planner.Day.Tile";

/** The date numeral in its ring-and-fill marker, shared by `default` and `calendar`. */
function PlannerDayMarker({ info, planner }: PlannerDayContentProps): ReactElement {
	const { isInMonth, isSelected, isToday } = info;
	const slots = plannerVariants({ fill: planner.fill, isInMonth, isSelected, isToday, variant: planner.variant });
	return (
		<View className={slots.marker()}>
			<View className={slots.markerFill()}>
				<Text className={slots.numeral()}>{String(info.date.getDate())}</Text>
			</View>
		</View>
	);
}
PlannerDayMarker.displayName = "DelacourUI.Planner.Day.Marker";

/** `calendar`: each entry's name in a block of its colour, then "+N more". */
function PlannerDayBlocks({ info, planner }: PlannerDayContentProps): ReactElement {
	const { variant, fill, entryLimit, categories } = planner;
	const slots = plannerVariants({ fill, variant });
	const { shown, overflow } = resolveDayDisplay(info.entries, variant, entryLimit);
	return (
		<>
			<PlannerDayMarker info={info} planner={planner} />
			<View className={slots.blocks()}>
				{shown.map((entry) => (
					<PlannerDayBlock
						className={slots.block()}
						color={resolveEntryColor(entry, categories)}
						key={entry.id}
						label={entry.label}
						labelClassName={slots.blockLabel()}
					/>
				))}
				{overflow > 0 ? (
					<Text className={slots.more()} numberOfLines={1}>
						+{overflow} more
					</Text>
				) : null}
			</View>
		</>
	);
}
PlannerDayBlocks.displayName = "DelacourUI.Planner.Day.Blocks";

/** `default`: a dot per category, up to `entryLimit` icons, and "+N". */
function PlannerDayMarks({ info, planner }: PlannerDayContentProps): ReactElement {
	const { variant, fill, entryLimit, categories } = planner;
	const slots = plannerVariants({ fill, variant });
	const { shown, overflow } = resolveDayDisplay(info.entries, variant, entryLimit);
	const dotColors = distinctColors(info.entries, planner);
	const icons = shown.filter((entry) => entry.icon !== undefined);
	return (
		<>
			<PlannerDayMarker info={info} planner={planner} />
			<View className={slots.dots()}>
				{dotColors.map(({ id, color }) => (
					<PlannerDayDot className={slots.dot()} color={color} key={id} />
				))}
			</View>
			{icons.length > 0 || overflow > 0 ? (
				<View className={slots.icons()}>
					{icons.map((entry) =>
						entry.icon ? (
							<Icon
								color={entryColorToken(resolveEntryColor(entry, categories))}
								icon={entry.icon}
								key={entry.id}
								size="xs"
							/>
						) : null
					)}
					{overflow > 0 ? <Text className={slots.overflow()}>+{overflow}</Text> : null}
				</View>
			) : null}
		</>
	);
}
PlannerDayMarks.displayName = "DelacourUI.Planner.Day.Marks";

/** Up to three colours, one per distinct category (or literal), in the order they first appear. */
function distinctColors(
	entries: readonly PlannerEntry[],
	planner: PlannerContextValue
): { id: string; color: PlannerEntryColor }[] {
	const seen = new Map<string, PlannerEntryColor>();
	for (const entry of entries) {
		const color = resolveEntryColor(entry, planner.categories);
		const id = color.kind === "literal" ? color.color : color.kind === "chart" ? `chart-${color.index}` : "default";
		if (!seen.has(id)) seen.set(id, color);
		if (seen.size === 3) break;
	}
	return [...seen].map(([id, color]) => ({ id, color }));
}

/** The class that paints a colour as a fill, or `undefined` for a literal, which is painted by style. */
function swatchClass(color: PlannerEntryColor): string | undefined {
	if (color.kind === "chart") return plannerVariants({ colorIndex: `${color.index}` }).swatch();
	return color.kind === "default" ? "bg-primary" : undefined;
}

/** The same colour at 15%, for a block or tile behind text — `undefined` for a literal. */
function tintClass(color: PlannerEntryColor): string | undefined {
	if (color.kind === "chart") return plannerVariants({ colorIndex: `${color.index}` }).tint();
	return color.kind === "default" ? "bg-primary/15" : undefined;
}

/** A category's dot. Hidden from assistive technology: the day's label already names the category. */
function PlannerDayDot({ color, className }: { color: PlannerEntryColor; className: string }): ReactElement {
	return (
		<View
			accessibilityElementsHidden
			className={cn(className, swatchClass(color))}
			importantForAccessibility="no"
			style={color.kind === "literal" ? { backgroundColor: color.color } : undefined}
		/>
	);
}
PlannerDayDot.displayName = "DelacourUI.Planner.Day.Dot";

/**
 * An entry's name in a block of its colour.
 *
 * A theme colour is a 15% tint behind foreground text, which reads in both
 * themes. A literal colour cannot be tinted without parsing it, so it is a
 * muted block with a 3pt bar of the colour down its leading edge instead —
 * never the colour as a fill behind text whose contrast nobody checked.
 */
function PlannerDayBlock({
	color,
	label,
	className,
	labelClassName,
}: {
	color: PlannerEntryColor;
	label: ReactNode;
	className: string;
	labelClassName: string;
}): ReactElement {
	const isLiteral = color.kind === "literal";
	return (
		<View
			className={cn(className, isLiteral ? "border-l-[3px] bg-muted" : tintClass(color))}
			style={isLiteral ? { borderLeftColor: color.color } : undefined}
		>
			<Text className={labelClassName} numberOfLines={1}>
				{label}
			</Text>
		</View>
	);
}
PlannerDayBlock.displayName = "DelacourUI.Planner.Day.Block";
