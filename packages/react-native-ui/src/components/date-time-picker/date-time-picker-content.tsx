import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { View } from "react-native";
import { BottomSheet } from "../bottom-sheet";
import { Tabs } from "../tabs";
import { useDateTimePickerPart } from "./date-time-picker.context";
import {
	DATE_TIME_PICKER_SECTIONS,
	type DateTimePickerSection,
	dateTimePickerVariants,
} from "./date-time-picker.variants";
import { DateTimePickerCalendar } from "./date-time-picker-calendar";
import { DateTimePickerClear } from "./date-time-picker-clear";
import { DateTimePickerDone } from "./date-time-picker-done";
import { DateTimePickerTime } from "./date-time-picker-time";

export type DateTimePickerContentProps = {
	/** The sheet's title. Omitted, the root's `title`. */
	title?: string;
	/** The footer's controls. Omitted, Done — with Clear before it when the root is clearable. */
	footer?: ReactNode;
	className?: string;
	/**
	 * The panel's sections. Omitted, `DateTimePicker.Calendar` and `DateTimePicker.Time`. In the
	 * `tabs` layout each is found by type and placed in its own tab; anything else follows the tabs.
	 */
	children?: ReactNode;
};

function isSection(value: string): value is DateTimePickerSection {
	return (DATE_TIME_PICKER_SECTIONS as readonly string[]).includes(value);
}

/**
 * Splits the caller's children into the two tab panels, by type — the way `Tabs` walks its own
 * children for panels. A section the caller left out falls back to the default part.
 */
function splitSections(children: ReactNode): { date: ReactNode; time: ReactNode; rest: ReactNode[] } {
	let date: ReactNode = null;
	let time: ReactNode = null;
	const rest: ReactNode[] = [];
	for (const child of Children.toArray(children)) {
		if (isValidElement(child) && child.type === DateTimePickerCalendar) date = child;
		else if (isValidElement(child) && child.type === DateTimePickerTime) time = child;
		else rest.push(child);
	}
	return { date: date ?? <DateTimePickerCalendar />, rest, time: time ?? <DateTimePickerTime /> };
}

/** The `tabs` layout: Date and Time behind a small primary tab bar, one at a time. */
function DateTimePickerTabs({ children }: { children?: ReactNode }): ReactElement {
	const picker = useDateTimePickerPart("DateTimePicker.Content");
	const slots = dateTimePickerVariants({ layout: "tabs" });
	const { date, time, rest } = splitSections(children);

	const handleTabChange = (next: string) => {
		if (isSection(next)) picker.setActiveSection(next);
	};

	return (
		<View className={slots.tabs()}>
			<Tabs
				isDisabled={picker.isDisabled}
				onValueChange={handleTabChange}
				size="sm"
				value={picker.activeSection}
				variant="primary"
			>
				<Tabs.List>
					<Tabs.Indicator />
					<Tabs.Trigger value="date">{picker.dateLabel}</Tabs.Trigger>
					<Tabs.Trigger value="time">{picker.timeLabel}</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="date">
					<View className={slots.panel()}>{date}</View>
				</Tabs.Content>
				<Tabs.Content value="time">{time}</Tabs.Content>
			</Tabs>
			{rest}
		</View>
	);
}
DateTimePickerTabs.displayName = "DelacourUI.DateTimePicker.Content.Tabs";

/**
 * Where the two halves are drawn, laid out per the root's `layout`.
 *
 * In a `sheet` picker: a `BottomSheet` portal with a scrim, a close control, the title, the panel and a pinned
 * footer holding Done (and Clear, when clearable). The sheet's content pan is off — every vertical
 * drag inside belongs to a wheel — and the handle still drags it. In an `inline` picker: the panel
 * on a card, in place, with no title and no footer, since nothing needs closing.
 *
 * `tabs` puts the calendar and the wheel in one fixed panel behind Date and Time tabs, which fits
 * the shortest phone; `stacked` draws the calendar, a hairline and a time row that opens the wheel.
 * Disabled fades and freezes the whole panel, inline included.
 */
export function DateTimePickerContent({
	title,
	footer,
	className,
	children,
}: DateTimePickerContentProps): ReactElement {
	const picker = useDateTimePickerPart("DateTimePicker.Content");
	const slots = dateTimePickerVariants({ isDisabled: picker.isDisabled, layout: picker.layout });

	const body =
		picker.layout === "tabs" ? (
			<DateTimePickerTabs>{children}</DateTimePickerTabs>
		) : (
			(children ?? (
				<>
					<DateTimePickerCalendar />
					<DateTimePickerTime />
				</>
			))
		);

	const panel = (
		<View className={slots.content()} pointerEvents={picker.isDisabled ? "none" : "auto"}>
			{body}
		</View>
	);

	if (picker.presentation === "inline") {
		return <View className={slots.inline({ className })}>{panel}</View>;
	}

	return (
		<BottomSheet.Portal>
			<BottomSheet.Overlay />
			<BottomSheet.Container>
				<BottomSheet.Content className={className}>
					<BottomSheet.Close />
					<BottomSheet.Title>{title ?? picker.title}</BottomSheet.Title>
					{panel}
				</BottomSheet.Content>
				<BottomSheet.Footer className={slots.footer()} sticky>
					{footer ?? (
						<>
							{picker.isClearable ? <DateTimePickerClear /> : null}
							<DateTimePickerDone />
						</>
					)}
				</BottomSheet.Footer>
			</BottomSheet.Container>
		</BottomSheet.Portal>
	);
}
DateTimePickerContent.displayName = "DelacourUI.DateTimePicker.Content";
