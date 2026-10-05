import { Fragment, type ReactElement, useCallback, useMemo, useState } from "react";
import { View } from "react-native";
import { Presets } from "react-native-pulsar";
import { useFieldContext } from "../field/field.context";
import { Text } from "../text";
import {
	compareTimes,
	currentTime,
	nearestEnabledTime,
	resolveDayPeriodLabels,
	resolveHourCycle,
	resolveInitialTime,
	type TimeValue,
} from "./time-picker.time";
import type { TimePickerWheelProps } from "./time-picker.types";
import {
	resolveTimeFromColumn,
	resolveTimeWheelColumns,
	resolveWheelPadding,
	TIME_PICKER_DEFAULT_VISIBLE_ROWS,
	TIME_PICKER_ROW_HEIGHTS,
	type TimeWheelColumnKind,
	timePickerVariants,
} from "./time-picker.variants";
import { TimeWheelColumn } from "./time-picker-wheel-column";

/** Drops or adds the seconds field so a value matches the wheel it came from. */
function withSecondsField(time: TimeValue, showSeconds: boolean): TimeValue {
	if (showSeconds) return { hour: time.hour, minute: time.minute, second: time.second ?? 0 };
	return { hour: time.hour, minute: time.minute };
}

/**
 * The bare wheel: an hour, a minute, an optional second and — on a 12-hour
 * clock — an AM/PM column, side by side over one selection band.
 *
 * Exported on its own for screens and other pickers that compose it —
 * `TimePicker presentation="inline"` and `TimePicker.Wheel` both render it,
 * and a date-and-time picker can too. It needs no `TimePicker` around it.
 *
 * **Every settle is pulled onto the step and inside the bounds before it is
 * reported.** A column landing on a dimmed row, or an hour change that leaves
 * the minute out of range, commits the nearest selectable time instead, plays
 * a light impact, and the columns scroll to it. `onValueChange` never sees a
 * time the picker would not let you pick.
 *
 * **A `null` value starts at now**, on the step and inside the bounds, and stays
 * `null` until a column settles: opening a picker is not choosing a time.
 *
 * @example
 * <TimePickerWheel minuteStep={5} onValueChange={setTime} value={time} />
 */
export function TimePickerWheel({
	value,
	onValueChange,
	minTime,
	maxTime,
	minuteStep = 1,
	showSeconds = false,
	hourCycle = "auto",
	locale,
	size = "md",
	visibleRows = TIME_PICKER_DEFAULT_VISIBLE_ROWS,
	isDisabled,
	className,
	testID,
}: TimePickerWheelProps): ReactElement {
	const field = useFieldContext();
	const resolvedDisabled = isDisabled ?? field?.isDisabled ?? false;
	const cycle = useMemo(() => (hourCycle === "auto" ? resolveHourCycle(locale) : hourCycle), [hourCycle, locale]);
	const periodLabels = useMemo(() => resolveDayPeriodLabels(locale), [locale]);
	const bounds = useMemo(() => ({ minTime, maxTime }), [minTime, maxTime]);

	const [draft, setDraft] = useState<TimeValue>(() =>
		resolveInitialTime(currentTime(), minuteStep, { minTime, maxTime }, showSeconds)
	);
	const shown = useMemo(() => withSecondsField(value ?? draft, showSeconds), [value, draft, showSeconds]);

	const columns = useMemo(
		() => resolveTimeWheelColumns({ time: shown, hourCycle: cycle, minuteStep, showSeconds, bounds, periodLabels }),
		[shown, cycle, minuteStep, showSeconds, bounds, periodLabels]
	);

	const handleSettle = useCallback(
		(kind: TimeWheelColumnKind, index: number) => {
			const column = columns.find((entry) => entry.kind === kind);
			const row = column?.rows[index];
			if (!row) return;
			const proposed = resolveTimeFromColumn(shown, kind, row.value);
			const next = withSecondsField(nearestEnabledTime(proposed, minuteStep, bounds), showSeconds);
			if (row.isDisabled || compareTimes(next, proposed) !== 0) Presets.System.impactLight();
			setDraft(next);
			if (value === null || compareTimes(next, value) !== 0) onValueChange(next);
		},
		[bounds, columns, minuteStep, onValueChange, shown, showSeconds, value]
	);

	const rowHeight = TIME_PICKER_ROW_HEIGHTS[size];
	const slots = timePickerVariants({ size, isDisabled: resolvedDisabled });

	return (
		<View className={slots.wheel({ className })} pointerEvents={resolvedDisabled ? "none" : "auto"} testID={testID}>
			<View
				className={slots.selectionBand()}
				pointerEvents="none"
				style={{ top: resolveWheelPadding(rowHeight, visibleRows), height: rowHeight }}
			/>
			{columns.map((column, index) => {
				const next = columns[index + 1];
				const hasSeparator = next !== undefined && next.kind !== "period";
				return (
					<Fragment key={column.kind}>
						<TimeWheelColumn
							isDisabled={resolvedDisabled}
							kind={column.kind}
							onSettle={handleSettle}
							rowHeight={rowHeight}
							rows={column.rows}
							selectedIndex={column.selectedIndex}
							size={size}
							visibleRows={visibleRows}
						/>
						{hasSeparator ? (
							<Text accessibilityElementsHidden className={slots.separator()} importantForAccessibility="no">
								:
							</Text>
						) : null}
					</Fragment>
				);
			})}
		</View>
	);
}
TimePickerWheel.displayName = "DelacourUI.TimePickerWheel";
