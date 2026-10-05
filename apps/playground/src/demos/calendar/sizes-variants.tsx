import {
	CALENDAR_SIZES,
	CALENDAR_VARIANTS,
	Calendar,
	type CalendarDate,
	type CalendarSize,
	type CalendarVariant,
} from "@delacour/react-native-ui/calendar";
import { ToggleButton } from "@delacour/react-native-ui/toggle-button";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Sizes and variants",
	caption:
		"`primary` fills the selected days; `secondary` softens them. The three sizes step the cell along the input scale — 36, 44 and 52 points — so a calendar beside a field shares its density.",
	capture: { align: "stretch" },
};

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };

/** Written out rather than mapped from the value, so no reader is shown a raw prop. */
const VARIANT_LABELS: Record<CalendarVariant, string> = { primary: "Primary", secondary: "Secondary" };
const SIZE_LABELS: Record<CalendarSize, string> = { sm: "Small", md: "Medium", lg: "Large" };

export function Demo(): ReactElement {
	const [variant, setVariant] = useState<CalendarVariant>("primary");
	const [size, setSize] = useState<CalendarSize>("sm");

	return (
		<View className="gap-3">
			<ToggleButton.Group
				accessibilityLabel="Variant"
				className="w-full"
				isSelectionRequired
				onSelected={(next) => setVariant((next[0] as CalendarVariant | undefined) ?? "primary")}
				selected={[variant]}
				selectionMode="single"
				size="sm"
				variant="outline"
			>
				{CALENDAR_VARIANTS.map((value) => (
					<ToggleButton className="flex-1" key={value} testID={`calendar-variant-${value}`} value={value}>
						{VARIANT_LABELS[value]}
					</ToggleButton>
				))}
			</ToggleButton.Group>
			<ToggleButton.Group
				accessibilityLabel="Size"
				className="w-full"
				isSelectionRequired
				onSelected={(next) => setSize((next[0] as CalendarSize | undefined) ?? "md")}
				selected={[size]}
				selectionMode="single"
				size="sm"
				variant="outline"
			>
				{CALENDAR_SIZES.map((value) => (
					<ToggleButton className="flex-1" key={value} testID={`calendar-size-${value}`} value={value}>
						{SIZE_LABELS[value]}
					</ToggleButton>
				))}
			</ToggleButton.Group>
			<Calendar
				defaultSelected={{ start: { year: 2026, month: 10, day: 12 }, end: { year: 2026, month: 10, day: 16 } }}
				mode="range"
				size={size}
				testID="calendar-sizes-variants"
				today={TODAY}
				variant={variant}
			/>
		</View>
	);
}
