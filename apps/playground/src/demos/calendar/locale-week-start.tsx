import { Calendar, type CalendarDate } from "@delacour/react-native-ui/calendar";
import { ToggleButton } from "@delacour/react-native-ui/toggle-button";
import { type ReactElement, useState } from "react";
import { View } from "react-native";
import type { DemoMeta } from "@/demos/types";

export const meta: DemoMeta = {
	title: "Locale and week start",
	caption:
		'Month and weekday names come from `Intl`, and `weekStartsOn="auto"` reads the first column from the locale: Monday in New Zealand, Sunday in the United States, Saturday in Egypt.',
};

const TODAY: CalendarDate = { year: 2026, month: 10, day: 5 };

const LOCALES = ["en-NZ", "en-US", "ar-EG"] as const;
type DemoLocale = (typeof LOCALES)[number];

const LABELS: Record<DemoLocale, string> = { "en-NZ": "New Zealand", "en-US": "United States", "ar-EG": "Egypt" };

export function Demo(): ReactElement {
	const [locale, setLocale] = useState<DemoLocale>("en-NZ");

	return (
		<View className="gap-3">
			<ToggleButton.Group
				accessibilityLabel="Locale"
				className="w-full"
				isSelectionRequired
				onSelected={(next) => setLocale((next[0] as DemoLocale | undefined) ?? "en-NZ")}
				selected={[locale]}
				selectionMode="single"
				size="sm"
				variant="outline"
			>
				{LOCALES.map((value) => (
					<ToggleButton className="flex-1" key={value} testID={`calendar-locale-${value}`} value={value}>
						{LABELS[value]}
					</ToggleButton>
				))}
			</ToggleButton.Group>
			<Calendar locale={locale} testID="calendar-locale" today={TODAY} />
		</View>
	);
}
